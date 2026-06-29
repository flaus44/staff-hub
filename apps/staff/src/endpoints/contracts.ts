import type { Endpoint, PayloadHandler } from 'payload'
import { z } from 'zod'

import { authenticated, relationId } from '@/access/roles'
import { actorIdFromUser, requestMeta, writeAuditLog } from '@/lib/audit'
import {
  resolveContractFormFields,
  resolveContractPdfFieldMap,
  profileUpdatesFromContractForm,
  type ContractPdfFieldMap,
} from '@/lib/contract-form'
import {
  buildOnboardingSummary,
  getContractConfirmationPrerequisites,
  mergeContractFormIntoSummary,
} from '@/lib/onboarding/onboarding-summary'
import { generateOnboardingSignedPacket } from '@/lib/onboarding-packet'
import { issueVaultFromPacketSections } from '@/lib/onboarding-documents'
import { maybeAutoSubmitOnboardingAssignment } from '@/lib/onboarding/submit-for-review'
import type { SurveyField } from '@/lib/survey-field'
import { E_SIGN_CONSENT_VERSION } from '@/lib/esign'
import { readMediaBytes } from '@/lib/media-files'
import { isDiditEnforced } from '@/lib/contract-didit'
import type { DiditDecision } from '@/lib/didit'
import { staffSignatureFromSignRequest } from '@/lib/staff-signature'

const formValuesSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))

const signSchema = z.object({
  contractId: z.union([z.string(), z.number()]),
  signatureDataUrl: z.string().min(1),
  signatureMethod: z.enum(['draw', 'type']),
  consentAccepted: z.literal(true),
  consentTimestamp: z.string().min(1),
  formValues: formValuesSchema.optional(),
  draftId: z.union([z.string(), z.number()]),
})

const previewSchema = z.object({
  contractId: z.union([z.string(), z.number()]),
  formValues: formValuesSchema.optional(),
})

const profileSyncSchema = z.object({
  formValues: formValuesSchema,
})

const confirmDetailsSchema = z.object({
  contractId: z.union([z.string(), z.number()]),
  formValues: formValuesSchema,
  summarySnapshot: z.record(z.unknown()),
  confirmedAt: z.string().min(1),
})

async function loadStaffUserForConfirmation(req: Parameters<PayloadHandler>[0]) {
  return (await req.payload.findByID({
    collection: 'staff-users',
    id: String(req.user!.id),
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as Record<string, unknown>
}

async function loadOnboardingTasksForUser(req: Parameters<PayloadHandler>[0], userId: string) {
  const result = await req.payload.find({
    collection: 'onboarding-tasks',
    where: { user: { equals: userId } },
    limit: 500,
    depth: 0,
    overrideAccess: true,
    req,
  })
  return result.docs as Array<{
    id: string | number
    type: string
    title: string
    status: string
    href?: string | null
    referenceCollection?: string | null
    referenceId?: string | number | null
  }>
}

function draftHasOnboardingConfirmation(draft: {
  onboardingConfirmedAt?: string | null
}): boolean {
  return Boolean(draft.onboardingConfirmedAt)
}

async function assertConfirmedDraft(
  req: Parameters<PayloadHandler>[0],
  draftId: string | number,
  contractId: string | number,
) {
  const draft = await req.payload.findByID({
    collection: 'contract-signing-drafts',
    id: draftId,
    depth: 0,
  })

  if (!draft) return { error: Response.json({ error: 'draft_not_found' }, { status: 404 }) }

  const draftUserId = typeof draft.user === 'object' ? draft.user?.id : draft.user
  const draftContractId = typeof draft.contract === 'object' ? draft.contract?.id : draft.contract

  if (String(draftUserId) !== String(req.user!.id) || String(draftContractId) !== String(contractId)) {
    return { error: Response.json({ error: 'forbidden' }, { status: 403 }) }
  }

  if (!draftHasOnboardingConfirmation(draft)) {
    return { error: Response.json({ error: 'onboarding_confirmation_required' }, { status: 400 }) }
  }

  return { draft }
}

async function syncStaffProfileFromContractForm(
  req: Parameters<PayloadHandler>[0],
  formValues: Record<string, unknown>,
) {
  const profile = profileUpdatesFromContractForm(formValues)
  if (Object.keys(profile).length === 0) return

  await req.payload.update({
    collection: 'staff-users',
    id: String(req.user!.id),
    data: { profile },
    overrideAccess: true,
    req,
  })
}

function formFieldLabels(fields: SurveyField[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.id, f.label]))
}

function contractRequiresForm(contract: {
  useDefaultForm?: boolean | null
  formFields?: unknown
}): boolean {
  if (contract.useDefaultForm === false) {
    return Array.isArray(contract.formFields) && contract.formFields.length > 0
  }
  return true
}

function resolveFormConfig(contract: {
  useDefaultForm?: boolean | null
  formFields?: unknown
  pdfFieldMap?: unknown
}) {
  const requiresForm = contractRequiresForm(contract)
  const formFields = requiresForm
    ? resolveContractFormFields(contract.formFields as SurveyField[] | null | undefined)
    : []
  const pdfFieldMap = resolveContractPdfFieldMap(contract.pdfFieldMap as ContractPdfFieldMap | null | undefined)
  return { requiresForm, formFields, pdfFieldMap, labels: formFieldLabels(formFields) }
}

export const confirmContractDetails: Endpoint = {
  path: '/portal/contracts/confirm-details',
  method: 'post',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    let body: z.infer<typeof confirmDetailsSchema>
    try {
      body = confirmDetailsSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const contract = await req.payload.findByID({
      collection: 'contracts',
      id: body.contractId,
      depth: 0,
    })
    if (!contract) return Response.json({ error: 'not_found' }, { status: 404 })

    const userId = String(req.user!.id)
    const tasks = await loadOnboardingTasksForUser(req, userId)
    const gate = getContractConfirmationPrerequisites(tasks, contract.id)
    if (!gate.canConfirm) {
      return Response.json({ error: 'onboarding_incomplete', incompleteTasks: gate.incompleteTasks }, { status: 400 })
    }

    const staffUser = await loadStaffUserForConfirmation(req)
    const expectedSummary = buildOnboardingSummary(staffUser, tasks)
    const { labels } = resolveFormConfig(contract)
    const summaryWithContract = mergeContractFormIntoSummary(
      expectedSummary,
      body.formValues as Record<string, unknown>,
      labels,
    )

    const existingDrafts = await req.payload.find({
      collection: 'contract-signing-drafts',
      where: {
        and: [{ user: { equals: userId } }, { contract: { equals: contract.id } }],
      },
      sort: '-updatedAt',
      limit: 1,
      overrideAccess: true,
      req,
    })

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const existingDraft = existingDrafts.docs[0]
    const draftData = {
      user: req.user!.id,
      contract: contract.id,
      formResponses: body.formValues,
      onboardingConfirmedAt: body.confirmedAt,
      onboardingSummarySnapshot: summaryWithContract,
      expiresAt,
      ...(existingDraft
        ? {
            verificationStatus: 'pending' as const,
            diditVerification: null,
            diditSessionId: null,
          }
        : {}),
    }

    const draft = existingDraft
      ? await req.payload.update({
          collection: 'contract-signing-drafts',
          id: existingDraft.id,
          data: draftData,
          overrideAccess: true,
          req,
        })
      : await req.payload.create({
          collection: 'contract-signing-drafts',
          data: {
            ...draftData,
            verificationStatus: 'pending',
          },
          overrideAccess: true,
          req,
        })

    await syncStaffProfileFromContractForm(req, body.formValues as Record<string, unknown>)

    return Response.json({ draftId: draft.id, summary: summaryWithContract })
  }) as PayloadHandler,
}

export const signContract: Endpoint = {
  path: '/portal/contracts/sign',
  method: 'post',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    let body: z.infer<typeof signSchema>
    try {
      body = signSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    try {
      const contract = await req.payload.findByID({
      collection: 'contracts',
      id: body.contractId,
      depth: 1,
    })

    if (!contract) return Response.json({ error: 'not_found' }, { status: 404 })

    const existing = await req.payload.find({
      collection: 'contract-signatures',
      where: {
        and: [{ user: { equals: req.user!.id } }, { contract: { equals: contract.id } }],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return Response.json({ error: 'already_signed' }, { status: 409 })
    }

    const user = req.user as { firstName?: string; lastName?: string; email?: string; id?: string | number }
    const signerName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Signer'
    const signedAt = new Date()
    const { pdfFieldMap, labels } = resolveFormConfig(contract)
    let formValues = body.formValues ?? {}
    let diditSessionId: string | null = null
    let diditVerification: DiditDecision | null = null
    let signingDraftId: string | number | null = null
    let onboardingConfirmedAt: string | null = null
    let onboardingSummarySnapshot: Record<string, unknown> | null = null

    const draftResult = await assertConfirmedDraft(req, body.draftId, contract.id)
    if (draftResult.error) return draftResult.error
    const draft = draftResult.draft!

    if (isDiditEnforced(contract) && draft.verificationStatus !== 'approved') {
      return Response.json({ error: 'didit_not_approved' }, { status: 400 })
    }

    formValues = (draft.formResponses as Record<string, unknown>) ?? formValues
    diditSessionId = draft.diditSessionId ?? null
    diditVerification = (draft.diditVerification as DiditDecision | null) ?? null
    signingDraftId = draft.id
    onboardingConfirmedAt = draft.onboardingConfirmedAt
      ? String(draft.onboardingConfirmedAt)
      : null
    onboardingSummarySnapshot =
      (draft.onboardingSummarySnapshot as Record<string, unknown> | null) ?? null

    const meta = requestMeta(req)
    const staffUserRecord = (await req.payload.findByID({
      collection: 'staff-users',
      id: String(req.user!.id),
      depth: 0,
      overrideAccess: true,
      req,
    })) as unknown as Record<string, unknown>

    const inlineSignature = await staffSignatureFromSignRequest({
      dataUrl: body.signatureDataUrl,
      signerName,
      signedAt,
      signatureMethod: body.signatureMethod,
    })

    const packet = await generateOnboardingSignedPacket({
      mode: 'sign',
      payload: req.payload,
      user: staffUserRecord,
      contract: {
        id: contract.id,
        title: contract.title,
        bodyText: contract.bodyText,
        documentPdfs: contract.documentPdfs,
        templatePdf: contract.templatePdf,
      },
      staffSignature: inlineSignature,
      onboardingSummarySnapshot: onboardingSummarySnapshot,
      onboardingConfirmedAt,
      signedAt,
      consentTimestamp: body.consentTimestamp,
      signatureMethod: body.signatureMethod,
      formValues,
      pdfFieldMap,
      formFieldLabels: labels,
      signerName,
      signerEmail: user.email,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      diditVerification,
      req,
    })

    const pdfBytes = packet.bytes
    const documentHash = packet.documentHash

    const pdfBuffer = Buffer.from(pdfBytes)
    const signedPdf = await req.payload.create({
      collection: 'media',
      data: { alt: `Signed ${contract.title}`, classification: 'contract' },
      file: {
        data: pdfBuffer,
        mimetype: 'application/pdf',
        name: `onboarding-packet-${req.user!.id}-signed.pdf`,
        size: pdfBuffer.length,
      },
      req,
    })

    let signatureImageId: string | number | null = null
    try {
      const pngBase64 = body.signatureDataUrl.replace(/^data:image\/png;base64,/, '')
      const signatureBuffer = Buffer.from(pngBase64, 'base64')
      if (signatureBuffer.length > 0) {
        const signatureMedia = await req.payload.create({
          collection: 'media',
          data: {
            alt: `Signature — ${signerName}`,
            classification: 'onboarding_pii',
          },
          file: {
            data: signatureBuffer,
            mimetype: 'image/png',
            name: `signature-${req.user!.id}-${signedAt.getTime()}.png`,
            size: signatureBuffer.length,
          },
          req,
        })
        signatureImageId = signatureMedia.id
      }
    } catch (error) {
      console.error('[contract.sign] failed to persist signature image', error)
    }

    const signature = await req.payload.create({
      collection: 'contract-signatures',
      data: {
        user: req.user!.id,
        contract: contract.id,
        contractVersion: contract.version,
        documentHash,
        signatureMethod: body.signatureMethod,
        signedAt: signedAt.toISOString(),
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        consentVersion: E_SIGN_CONSENT_VERSION,
        consentTimestamp: body.consentTimestamp,
        formResponses: formValues,
        signingDraft: signingDraftId,
        diditSessionId,
        diditVerification,
        onboardingConfirmedAt,
        onboardingSummarySnapshot,
        signedPdf: signedPdf.id,
        ...(signatureImageId ? { signatureImage: signatureImageId } : {}),
      },
      req,
    })

    try {
      const assignmentRes = await req.payload.find({
        collection: 'onboarding-assignments',
        where: { user: { equals: String(req.user!.id) } },
        sort: '-updatedAt',
        limit: 1,
        overrideAccess: true,
        req,
      })

      await issueVaultFromPacketSections(req.payload, {
        userId: String(req.user!.id),
        assignmentId: assignmentRes.docs[0]?.id ? String(assignmentRes.docs[0].id) : null,
        contractSignatureId: String(signature.id),
        packetBytes: pdfBytes,
        sections: packet.sections,
        summarySnapshotHash: packet.summarySnapshotHash ?? undefined,
        signedAt: signedAt.toISOString(),
        req,
      })
    } catch (vaultError) {
      try {
        await req.payload.delete({
          collection: 'contract-signatures',
          id: signature.id,
          overrideAccess: true,
          req,
        })
      } catch (rollbackError) {
        console.error('[contract.sign] failed to roll back signature after vault error', rollbackError)
      }
      throw vaultError
    }

    await writeAuditLog(req.payload, {
      actorId: actorIdFromUser(req.user),
      action: 'contract.sign',
      resourceType: 'contract-signatures',
      resourceId: signature.id,
      ...requestMeta(req),
      metadata: { contractId: contract.id, documentHash, mergedDocuments: packet.sections.length },
    })

    await syncStaffProfileFromContractForm(req, formValues as Record<string, unknown>)

    const assignmentRes = await req.payload.find({
      collection: 'onboarding-assignments',
      where: { user: { equals: String(req.user!.id) } },
      sort: '-updatedAt',
      limit: 1,
      overrideAccess: true,
      req,
    })
    await maybeAutoSubmitOnboardingAssignment(req.payload, {
      userId: req.user!.id,
      assignmentId: assignmentRes.docs[0]?.id,
      actorId: req.user!.id,
      req,
    })

    return Response.json({
      signature,
      contractId: contract.id,
      mergedDocumentCount: packet.sections.length,
    })
    } catch (error) {
      console.error('[contract.sign] failed', error)
      const message = error instanceof Error ? error.message : 'sign_failed'
      return Response.json({ error: message }, { status: 500 })
    }
  }) as PayloadHandler,
}

export const previewContract: Endpoint = {
  path: '/portal/contracts/preview',
  method: 'post',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    let body: z.infer<typeof previewSchema>
    try {
      body = previewSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const contract = await req.payload.findByID({
      collection: 'contracts',
      id: body.contractId,
      depth: 1,
    })

    if (!contract) return Response.json({ error: 'not_found' }, { status: 404 })

    const staffUserRecord = (await req.payload.findByID({
      collection: 'staff-users',
      id: String(req.user!.id),
      depth: 0,
      overrideAccess: true,
      req,
    })) as unknown as Record<string, unknown>

    const { pdfFieldMap, labels } = resolveFormConfig(contract)
    const user = req.user as { firstName?: string; lastName?: string; email?: string }
    const signerName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Signer'

    const draftResult = await req.payload.find({
      collection: 'contract-signing-drafts',
      where: {
        and: [{ user: { equals: String(req.user!.id) } }, { contract: { equals: contract.id } }],
      },
      sort: '-updatedAt',
      limit: 1,
      overrideAccess: true,
      req,
    })
    const draft = draftResult.docs[0]

    const packet = await generateOnboardingSignedPacket({
      mode: 'preview',
      payload: req.payload,
      user: staffUserRecord,
      contract: {
        id: contract.id,
        title: contract.title,
        bodyText: contract.bodyText,
        documentPdfs: contract.documentPdfs,
        templatePdf: contract.templatePdf,
      },
      formValues: (draft?.formResponses as Record<string, unknown>) ?? body.formValues ?? {},
      onboardingSummarySnapshot: draft?.onboardingSummarySnapshot,
      onboardingConfirmedAt: draft?.onboardingConfirmedAt
        ? String(draft.onboardingConfirmedAt)
        : null,
      pdfFieldMap,
      formFieldLabels: labels,
      signerName,
      req,
    })

    const filename = `${contract.title.replace(/[^\w\s-]/g, '').trim() || 'onboarding'}-preview.pdf`

    return new Response(Buffer.from(packet.bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  }) as PayloadHandler,
}

export const syncContractProfile: Endpoint = {
  path: '/portal/contracts/profile-sync',
  method: 'post',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    let body: z.infer<typeof profileSyncSchema>
    try {
      body = profileSyncSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    await syncStaffProfileFromContractForm(req, body.formValues as Record<string, unknown>)
    return Response.json({ ok: true })
  }) as PayloadHandler,
}

export const downloadSignedContract: Endpoint = {
  path: '/portal/contracts/download',
  method: 'get',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    const contractId = req.query?.contractId as string | undefined
    if (!contractId) {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const signatures = await req.payload.find({
      collection: 'contract-signatures',
      where: {
        and: [{ user: { equals: req.user!.id } }, { contract: { equals: contractId } }],
      },
      depth: 1,
      limit: 1,
    })

    const signature = signatures.docs[0]
    if (!signature?.signedPdf) {
      return Response.json({ error: 'not_signed' }, { status: 404 })
    }

    const mediaId = relationId(signature.signedPdf)
    if (!mediaId) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    const bytes = await readMediaBytes(req.payload, mediaId)
    const disposition = (req.query?.disposition as string) === 'attachment' ? 'attachment' : 'inline'
    const contractTitle =
      typeof signature.contract === 'object' && signature.contract !== null && 'title' in signature.contract
        ? String(signature.contract.title)
        : `contract-${contractId}`

    const filename = `${contractTitle.replace(/[^\w\s-]/g, '').trim() || 'contract'}-signed.pdf`

    await writeAuditLog(req.payload, {
      actorId: actorIdFromUser(req.user),
      action: 'contract.download',
      resourceType: 'contract-signatures',
      resourceId: signature.id,
      ...requestMeta(req),
      metadata: { contractId },
    })

    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  }) as PayloadHandler,
}
