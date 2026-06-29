import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Endpoint, PayloadHandler } from 'payload'
import { z } from 'zod'

import { adminOrManager } from '@/access/roles'
import {
  buildSuperDocumentBytes,
  buildTaxDocumentBytes,
  mergeStaffUserForFormFill,
} from '@/lib/onboarding-documents'
import {
  maybeAutoSubmitOnboardingAssignment,
  submitOnboardingAssignmentForReview,
} from '@/lib/onboarding/submit-for-review'
import {
  getMissingProfileFields,
  PROFILE_TASK_REQUIRED_FIELDS,
  TAX_PROFILE_REQUIRED_FIELDS,
} from '@/lib/onboarding/profile-validation'
import { queueOnboardingXeroSync } from '@/lib/onboarding/xero-sync'
import { resolveNat309TitleExport } from '@/lib/onboarding-pdf/field-maps/nat3093-radio-values'
import { relId } from '@/lib/payload-relations'
import { encryptTfn, maskTfn } from '@/lib/tfn-encryption'

function ensureAdminOrManager(req: Parameters<PayloadHandler>[0]) {
  if (!adminOrManager({ req })) {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }
  return null
}

const claimSchema = z.object({
  assignmentId: z.union([z.string(), z.number()]),
})

const decisionSchema = z.object({
  assignmentId: z.union([z.string(), z.number()]),
  decision: z.enum(['approve', 'reject']),
  note: z.string().optional(),
  rejectedTaskIds: z.array(z.union([z.string(), z.number()])).optional(),
})

const payrollSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  format: z.enum(['csv', 'pdf']).default('csv'),
})

const completeTaskSchema = z.object({
  taskId: z.union([z.string(), z.number()]),
  status: z.enum(['in_progress', 'awaiting_review', 'complete']).default('complete'),
  notes: z.string().optional(),
  updates: z.record(z.string(), z.unknown()).optional(),
})

const submitSchema = z.object({
  assignmentId: z.union([z.string(), z.number()]),
})

function relationId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}

function relIdNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  if (typeof value === 'object' && value && 'id' in value) {
    return relIdNumber((value as { id: unknown }).id)
  }
  return null
}

export const onboardingReviewQueue: Endpoint = {
  path: '/onboarding/review/queue',
  method: 'get',
  handler: (async (req) => {
    const blocked = ensureAdminOrManager(req)
    if (blocked) return blocked

    const queue = await req.payload.find({
      collection: 'onboarding-assignments',
      where: { status: { in: ['submitted', 'pending_admin_review'] } },
      limit: 200,
      sort: 'submittedAt',
      req,
    })

    return Response.json({ docs: queue.docs, totalDocs: queue.totalDocs })
  }) as PayloadHandler,
}

export const onboardingClaimReview: Endpoint = {
  path: '/onboarding/review/claim',
  method: 'post',
  handler: (async (req) => {
    const blocked = ensureAdminOrManager(req)
    if (blocked) return blocked

    let body: z.infer<typeof claimSchema>
    try {
      body = claimSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const assignment = await req.payload.findByID({
      collection: 'onboarding-assignments',
      id: body.assignmentId,
      req,
    })

    if (!assignment) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    const updated = await req.payload.update({
      collection: 'onboarding-assignments',
      id: assignment.id,
      data: {
        reviewer: req.user!.id,
        reviewLockAt: new Date().toISOString(),
        status:
          assignment.status === 'submitted' ? 'pending_admin_review' : assignment.status,
      },
      req,
    })

    return Response.json({ assignment: updated })
  }) as PayloadHandler,
}

export const onboardingReviewDecision: Endpoint = {
  path: '/onboarding/review/decision',
  method: 'post',
  handler: (async (req) => {
    const blocked = ensureAdminOrManager(req)
    if (blocked) return blocked

    let body: z.infer<typeof decisionSchema>
    try {
      body = decisionSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const assignment = await req.payload.findByID({
      collection: 'onboarding-assignments',
      id: body.assignmentId,
      req,
    })

    if (!assignment) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    const userId =
      typeof assignment.user === 'object' ? assignment.user?.id : assignment.user
    if (!userId) {
      return Response.json({ error: 'assignment_missing_user' }, { status: 422 })
    }

    const nowIso = new Date().toISOString()
    const approved = body.decision === 'approve'

    if (!approved) {
      const rejectedTaskIds = (body.rejectedTaskIds ?? []).map(String)
      await Promise.all(
        rejectedTaskIds.map((taskId) =>
          req.payload.update({
            collection: 'onboarding-tasks',
            id: taskId,
            data: {
              status: 'rejected',
              notes: body.note ?? 'Please review and resubmit this task.',
            },
            req,
          }),
        ),
      )
    }

    let stapledSuperReviewRequired = false
    if (approved) {
      const settings = (await req.payload.findGlobal({
        slug: 'org-settings',
        depth: 0,
        overrideAccess: true,
        req,
      })) as Record<string, unknown>
      stapledSuperReviewRequired = settings.enableStapledSuperReview !== false
    }

    const updatedAssignment = await req.payload.update({
      collection: 'onboarding-assignments',
      id: assignment.id,
      data: {
        status: approved ? 'approved' : 'rejected',
        reviewedAt: nowIso,
        reviewer: req.user!.id,
        reviewLockAt: null,
        reviewNotes: body.note,
        stapledSuperReviewRequired: approved ? stapledSuperReviewRequired : false,
      },
      req,
    })

    await req.payload.update({
      collection: 'staff-users',
      id: String(userId),
      data: {
        onboardingStatus: approved ? 'approved' : 'in_progress',
        status: approved ? 'active' : 'invited',
      },
      req,
    })

    await req.payload.create({
      collection: 'onboarding-events',
      data: {
        user: relIdNumber(userId),
        assignment: relIdNumber(assignment.id),
        actor: relIdNumber(req.user!.id),
        eventType: approved ? 'approved' : 'rejected',
        note: body.note,
      },
      overrideAccess: true,
      req,
    })

    if (approved) {
      await queueOnboardingXeroSync({
        payload: req.payload,
        assignment: updatedAssignment as unknown as Record<string, unknown>,
        actorId: req.user?.id,
        req,
      })
    }

    return Response.json({ assignment: updatedAssignment })
  }) as PayloadHandler,
}

function toCsvRows(user: Record<string, unknown>) {
  const profile = (user.profile as Record<string, unknown> | undefined) ?? {}
  const rows = [
    ['field', 'value'],
    ['firstName', String(user.firstName ?? '')],
    ['lastName', String(user.lastName ?? '')],
    ['email', String(user.email ?? '')],
    ['mobile', String(profile.mobile ?? '')],
    ['addressLine1', String(profile.addressLine1 ?? '')],
    ['suburb', String(profile.suburb ?? '')],
    ['state', String(profile.state ?? '')],
    ['postcode', String(profile.postcode ?? '')],
    ['bankAccountMasked', String(user.bankAccountMasked ?? '')],
    ['superChoiceStatus', String(user.superChoiceStatus ?? '')],
    ['superFundName', String(user.superFundName ?? '')],
    ['superFundId', String(user.superFundId ?? '')],
    ['superMemberNumber', String(user.superMemberNumber ?? '')],
    ['superUseDefaultFund', String(user.superUseDefaultFund ?? false)],
    ['taxSetupStatus', String(user.taxSetupStatus ?? '')],
    ['awardName', String(user.awardName ?? '')],
    ['classificationLevel', String(user.classificationLevel ?? '')],
  ]

  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
}

async function buildPayrollPacketPdf(user: Record<string, unknown>): Promise<Uint8Array> {
  const profile = (user.profile as Record<string, unknown> | undefined) ?? {}
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold)

  page.drawText('FLAUS Payroll Packet', {
    x: 48,
    y: 790,
    size: 18,
    font: titleFont,
    color: rgb(0.12, 0.12, 0.12),
  })

  const superLines = user.superUseDefaultFund
    ? ['Super fund: Employer default']
    : [
        `Super fund: ${String(user.superFundName ?? '')}`,
        `Super fund ID: ${String(user.superFundId ?? '')}`,
        `Super member number: ${String(user.superMemberNumber ?? '')}`,
      ]

  const lines = [
    `Generated: ${new Date().toLocaleString('en-AU')}`,
    `Employee: ${String(user.firstName ?? '')} ${String(user.lastName ?? '')}`.trim(),
    `Email: ${String(user.email ?? '')}`,
    `Mobile: ${String(profile.mobile ?? '')}`,
    `Address: ${String(profile.addressLine1 ?? '')}, ${String(profile.suburb ?? '')}, ${String(
      profile.state ?? '',
    )} ${String(profile.postcode ?? '')}`.trim(),
    `Bank account: ${String(user.bankAccountMasked ?? '')}`,
    `Super choice: ${String(user.superChoiceStatus ?? '')}`,
    ...superLines,
    `Tax setup: ${String(user.taxSetupStatus ?? '')}`,
    `Award: ${String(user.awardName ?? '')}`,
    `Classification: ${String(user.classificationLevel ?? '')}`,
  ]

  let y = 752
  for (const line of lines) {
    page.drawText(line, { x: 48, y, size: 12, font, color: rgb(0.2, 0.2, 0.2) })
    y -= 26
  }

  return doc.save()
}

export const onboardingPayrollPacket: Endpoint = {
  path: '/onboarding/payroll-packet',
  method: 'post',
  handler: (async (req) => {
    const blocked = ensureAdminOrManager(req)
    if (blocked) return blocked

    let body: z.infer<typeof payrollSchema>
    try {
      body = payrollSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const user = (await req.payload.findByID({
      collection: 'staff-users',
      id: body.userId,
      req,
    })) as unknown as Record<string, unknown> | null

    if (!user) {
      return Response.json({ error: 'user_not_found' }, { status: 404 })
    }

    const assignmentRes = await req.payload.find({
      collection: 'onboarding-assignments',
      where: { user: { equals: String(body.userId) } },
      sort: '-updatedAt',
      limit: 1,
      req,
    })
    const assignment = assignmentRes.docs[0]

    await req.payload.create({
      collection: 'onboarding-events',
      data: {
        user: String(body.userId),
        assignment: assignment?.id,
        actor: req.user!.id,
        eventType: 'payroll_packet_exported',
        metadata: { format: body.format },
      },
      req,
    })

    if (body.format === 'pdf') {
      const pdfBytes = await buildPayrollPacketPdf(user)
      return new Response(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="payroll-packet-${body.userId}.pdf"`,
        },
      })
    }

    const csv = toCsvRows(user)
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="payroll-packet-${body.userId}.csv"`,
      },
    })
  }) as PayloadHandler,
}

export const onboardingTaskUpdate: Endpoint = {
  path: '/onboarding/tasks/update',
  method: 'post',
  handler: (async (req) => {
    if (!req.user) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    let body: z.infer<typeof completeTaskSchema>
    try {
      body = completeTaskSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const task = await req.payload.findByID({
      collection: 'onboarding-tasks',
      id: body.taskId,
      req,
    })
    if (!task) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }
    const taskUserId = typeof task.user === 'object' ? task.user?.id : task.user
    if (!taskUserId || String(taskUserId) !== String(req.user.id)) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    const fetchedUser = (await req.payload.findByID({
      collection: 'staff-users',
      id: String(req.user.id),
      depth: 0,
      overrideAccess: true,
      req,
    })) as unknown as Record<string, unknown>
    const currentUser = mergeStaffUserForFormFill(fetchedUser, req.user)
    const currentProfile = (currentUser.profile as Record<string, unknown> | undefined) ?? {}

    const nowIso = new Date().toISOString()
    const taskAssignmentId = relationId(task.assignment)
    const isFwisTask = task.type === 'fwis'
    const isRtwTask = task.type === 'rtw'
    const isTaxTask = task.type === 'tax'
    const isSuperTask = task.type === 'super'
    const incomingUpdates =
      body.updates && Object.keys(body.updates).length > 0
        ? { ...(body.updates as Record<string, unknown>) }
        : {}
    const staffUserUpdates: Record<string, unknown> = {}
    const generatedDocumentIds: string[] = []
    const generatedDocuments: Array<{ id: string; formId: string; title: string }> = []
    const isCompletingTask = body.status === 'complete'
    let pendingTaxPersistence: Record<string, unknown> | null = null

    const profileAllowlist = new Set([
      'title',
      'dateOfBirth',
      'mobile',
      'addressLine1',
      'addressLine2',
      'suburb',
      'state',
      'postcode',
      'otherGivenNames',
      'emergencyContactName',
      'emergencyContactPhone',
      'emergencyContactRelationship',
    ])
    const bankAllowlist = new Set(['bankAccountName', 'bankBsb', 'bankAccountNumber'])
    const rtwAllowlist = new Set(['citizenshipPath', 'visaSubclass', 'workRightsExpiry'])
    const taxAllowlist = new Set([
      'claimTaxFreeThreshold',
      'hasHelpDebt',
      'hasSslDebt',
      'hasTslDebt',
      'hasVslDebt',
      'hasSfssDebt',
      'medicareExemption',
      'residencyStatus',
      'tfn',
    ])
    const superAllowlist = new Set([
      'superUseDefaultFund',
      'superUseSmsf',
      'superFundName',
      'superFundId',
      'superMemberNumber',
      'superFundAbn',
      'smsfName',
      'smsfAbn',
      'smsfEsa',
      'smsfBankName',
      'smsfBsb',
      'smsfAccountNumber',
    ])

    function pickAllowed(allowlist: Set<string>): Record<string, unknown> {
      return Object.fromEntries(
        Object.entries(incomingUpdates).filter(([key]) => allowlist.has(key)),
      )
    }

    if (task.type === 'profile') {
      const nestedProfile =
        incomingUpdates.profile && typeof incomingUpdates.profile === 'object'
          ? (incomingUpdates.profile as Record<string, unknown>)
          : null
      const profileUpdates = nestedProfile
        ? Object.fromEntries(
            Object.entries(nestedProfile).filter(([key]) => profileAllowlist.has(key)),
          )
        : pickAllowed(profileAllowlist)
      staffUserUpdates.profile = { ...currentProfile, ...profileUpdates }

      if (isCompletingTask) {
        const mergedProfile = staffUserUpdates.profile as Record<string, unknown>
        const missingProfileFields = getMissingProfileFields(
          mergedProfile,
          PROFILE_TASK_REQUIRED_FIELDS,
        )
        if (missingProfileFields.length > 0) {
          return Response.json(
            { error: 'profile_incomplete', missingFields: missingProfileFields },
            { status: 400 },
          )
        }
        if (!resolveNat309TitleExport(mergedProfile.title)) {
          return Response.json({ error: 'title_required' }, { status: 400 })
        }
      }
    }

    if (task.type === 'bank') {
      Object.assign(staffUserUpdates, pickAllowed(bankAllowlist))
    }

    if (isFwisTask) {
      const acknowledged = incomingUpdates.fwisAcknowledged === true
      const ceisAcknowledged = incomingUpdates.ceisAcknowledged === true
      if (!acknowledged || !ceisAcknowledged) {
        return Response.json({ error: 'fwis_acknowledgement_required' }, { status: 400 })
      }
    }

    if (isRtwTask) {
      const rtwUpdates = pickAllowed(rtwAllowlist)
      const citizenshipPath = String(rtwUpdates.citizenshipPath ?? '').trim()
      const validCitizenshipPaths = new Set(['australian_citizen', 'permanent_resident', 'visa_holder'])
      if (!validCitizenshipPaths.has(citizenshipPath)) {
        return Response.json({ error: 'invalid_citizenship_path' }, { status: 400 })
      }
      const visaSubclass = String(rtwUpdates.visaSubclass ?? '').trim()
      const workRightsExpiry = String(rtwUpdates.workRightsExpiry ?? '').trim()
      const requiresVisaDetails = citizenshipPath === 'visa_holder'
      if (requiresVisaDetails && !visaSubclass) {
        return Response.json({ error: 'invalid_visa_subclass' }, { status: 400 })
      }
      if (requiresVisaDetails && !workRightsExpiry) {
        return Response.json({ error: 'invalid_work_rights_expiry' }, { status: 400 })
      }
      staffUserUpdates.rtwStatus = 'submitted'
      staffUserUpdates.citizenshipPath = citizenshipPath
      staffUserUpdates.visaSubclass = requiresVisaDetails ? visaSubclass : null
      staffUserUpdates.workRightsExpiry = requiresVisaDetails ? workRightsExpiry : null
    }

    if (isTaxTask) {
      const taxUpdates = pickAllowed(taxAllowlist)

      if (isCompletingTask) {
        const missingProfileFields = getMissingProfileFields(
          currentProfile,
          TAX_PROFILE_REQUIRED_FIELDS,
        )
        if (missingProfileFields.length > 0) {
          return Response.json(
            { error: 'profile_incomplete_for_tax', missingFields: missingProfileFields },
            { status: 400 },
          )
        }
      }

      const tfnRaw = String(taxUpdates.tfn ?? '').trim()
      if (!tfnRaw) {
        return Response.json({ error: 'invalid_tfn' }, { status: 400 })
      }
      if (!resolveNat309TitleExport(currentProfile.title)) {
        return Response.json({ error: 'title_required' }, { status: 400 })
      }
      const previewContentHashes = (incomingUpdates.previewContentHashes ?? null) as
        | Record<string, unknown>
        | null
      const nat3092Verified = incomingUpdates.nat3092Verified === true
      const nat3093Verified = incomingUpdates.nat3093Verified === true
      if (isCompletingTask && (!nat3092Verified || !nat3093Verified)) {
        return Response.json({ error: 'forms_verification_required' }, { status: 400 })
      }
      if (
        isCompletingTask
        && (!previewContentHashes || !previewContentHashes.nat3092 || !previewContentHashes.nat3093)
      ) {
        return Response.json({ error: 'forms_verification_required' }, { status: 400 })
      }

      const { tfn: _tfn, ...taxDeclarationFields } = taxUpdates
      pendingTaxPersistence = {
        tfnEncrypted: encryptTfn(tfnRaw),
        tfnMasked: maskTfn(tfnRaw),
        taxSetupStatus: 'employee_confirmed',
        taxDeclaration: {
          ...taxDeclarationFields,
          tfnMasked: maskTfn(tfnRaw),
        },
      }

      if (!isCompletingTask) {
        Object.assign(staffUserUpdates, pendingTaxPersistence)
      }
    }

    if (isSuperTask) {
      if (isCompletingTask) {
        const taxReady = currentUser.taxSetupStatus === 'employee_confirmed'
        const tfnEncrypted = currentUser.tfnEncrypted
        const hasTfnEncrypted =
          typeof tfnEncrypted === 'string'
            ? tfnEncrypted.trim() !== ''
            : tfnEncrypted !== null && tfnEncrypted !== undefined
        if (!taxReady || !hasTfnEncrypted) {
          return Response.json({ error: 'tax_required_for_super' }, { status: 400 })
        }

        const previewContentHashes = (incomingUpdates.previewContentHashes ?? null) as
          | Record<string, unknown>
          | null
        const nat13080Verified = incomingUpdates.nat13080Verified === true
        if (!nat13080Verified || !previewContentHashes?.nat13080) {
          return Response.json({ error: 'forms_verification_required' }, { status: 400 })
        }
      }

      const superUpdates = pickAllowed(superAllowlist)
      const useDefault = superUpdates.superUseDefaultFund === true
      const useSmsf = superUpdates.superUseSmsf === true
      const fundName = String(superUpdates.superFundName ?? '').trim()
      const fundId = String(superUpdates.superFundId ?? '').trim()
      const memberNumber = String(superUpdates.superMemberNumber ?? '').trim()
      const hasManualDetails = Boolean(fundName || fundId || memberNumber)

      if (useDefault && (hasManualDetails || useSmsf)) {
        return Response.json({ error: 'invalid_super_choice' }, { status: 400 })
      }
      if (!useDefault && !useSmsf && !hasManualDetails) {
        return Response.json({ error: 'invalid_super_choice' }, { status: 400 })
      }
      if (!useDefault && !useSmsf && (!fundName || !fundId || !memberNumber)) {
        return Response.json({ error: 'invalid_super_details' }, { status: 400 })
      }

      if (useDefault || useSmsf) {
        staffUserUpdates.superComplianceLetter = null
        staffUserUpdates.superComplianceLetterDocument = null
      }

      staffUserUpdates.superChoiceStatus = 'submitted'
      staffUserUpdates.superUseDefaultFund = useDefault
      staffUserUpdates.superFundName = useDefault ? null : fundName || null
      staffUserUpdates.superFundId = useDefault ? null : fundId || null
      staffUserUpdates.superMemberNumber = useDefault ? null : memberNumber || null
      Object.assign(staffUserUpdates, superUpdates)

      let complianceLetterUploadedAt: string | undefined
      if (!useDefault && !useSmsf) {
        const complianceDocumentId = relId(currentUser.superComplianceLetterDocument)
        if (complianceDocumentId) {
          const complianceDocument = await req.payload.findByID({
            collection: 'onboarding-documents',
            id: complianceDocumentId,
            depth: 0,
            overrideAccess: true,
            req,
          })
          const metadata =
            complianceDocument?.metadata && typeof complianceDocument.metadata === 'object'
              ? (complianceDocument.metadata as Record<string, unknown>)
              : {}
          const uploadedAt = String(metadata.uploadedAt ?? '').trim()
          complianceLetterUploadedAt = uploadedAt || undefined
        }
      }

      staffUserUpdates.superChoiceData = {
        ...superUpdates,
        ...(complianceLetterUploadedAt ? { complianceLetterUploadedAt } : {}),
      }
    }

    if (body.status === 'complete') {
      try {
        if (isTaxTask) {
          const taxUpdates = pickAllowed(taxAllowlist)
          const previewContentHashes = (incomingUpdates.previewContentHashes ?? {}) as Record<
            string,
            unknown
          >
          const built = await buildTaxDocumentBytes(req.payload, {
            user: currentUser,
            taskUpdates: taxUpdates,
            staffSignature: null,
            req,
          })
          if (
            String(previewContentHashes.nat3092) !== built.nat3092.contentHash
            || String(previewContentHashes.nat3093) !== built.nat3093.contentHash
          ) {
            return Response.json({ error: 'preview_stale' }, { status: 400 })
          }
          generatedDocuments.push(
            { id: 'pending', formId: 'nat3092', title: 'NAT 3092 TFN declaration' },
            { id: 'pending', formId: 'nat3093', title: 'NAT 3093 withholding declaration' },
          )
          await req.payload.create({
            collection: 'onboarding-events',
            data: {
              user: relIdNumber(req.user.id),
              assignment: relIdNumber(task.assignment),
              task: relIdNumber(task.id),
              actor: relIdNumber(req.user.id),
              eventType: 'forms_verified',
              metadata: {
                formIds: ['nat3092', 'nat3093'],
                contentHashes: {
                  nat3092: built.nat3092.contentHash,
                  nat3093: built.nat3093.contentHash,
                },
                verifiedAt: nowIso,
              },
            },
            overrideAccess: true,
            req,
          })
        }

        if (isSuperTask) {
          const superUpdates = pickAllowed(superAllowlist)
          const previewContentHashes = (incomingUpdates.previewContentHashes ?? {}) as Record<
            string,
            unknown
          >
          const built = await buildSuperDocumentBytes(req.payload, {
            user: { ...currentUser, ...(pendingTaxPersistence ?? {}) },
            taskUpdates: superUpdates,
            staffSignature: null,
            req,
          })
          if (String(previewContentHashes.nat13080) !== built.nat13080.contentHash) {
            return Response.json({ error: 'preview_stale' }, { status: 400 })
          }
          generatedDocuments.push({
            id: 'pending',
            formId: 'nat13080',
            title: 'NAT 13080 Superannuation standard choice form',
          })
          await req.payload.create({
            collection: 'onboarding-events',
            data: {
              user: relIdNumber(req.user.id),
              assignment: relIdNumber(task.assignment),
              task: relIdNumber(task.id),
              actor: relIdNumber(req.user.id),
              eventType: 'forms_verified',
              metadata: {
                formIds: ['nat13080'],
                contentHashes: {
                  nat13080: built.nat13080.contentHash,
                },
                verifiedAt: nowIso,
              },
            },
            overrideAccess: true,
            req,
          })
        }

        if (isFwisTask) {
          await req.payload.create({
            collection: 'onboarding-events',
            data: {
              user: relIdNumber(req.user.id),
              assignment: relIdNumber(task.assignment),
              task: relIdNumber(task.id),
              actor: relIdNumber(req.user.id),
              eventType: 'forms_verified',
              metadata: {
                formIds: ['fwis', 'ceis'],
                verifiedAt: nowIso,
              },
            },
            overrideAccess: true,
            req,
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'task_completion_failed'
        console.error('[onboardingTaskUpdate] document generation failed', {
          taskId: task.id,
          taskType: task.type,
          error,
        })
        return Response.json(
          {
            error: process.env.NODE_ENV === 'development' ? errorMessage : 'task_completion_failed',
          },
          { status: 500 },
        )
      }
    }

    if (pendingTaxPersistence && isCompletingTask) {
      Object.assign(staffUserUpdates, pendingTaxPersistence)
    }

    const updated = await req.payload.update({
      collection: 'onboarding-tasks',
      id: task.id,
      data: {
        status: body.status,
        completedAt: body.status === 'complete' ? nowIso : undefined,
        completedBy: body.status === 'complete' ? relIdNumber(req.user.id) : undefined,
        notes: body.notes,
      },
      overrideAccess: true,
      req,
    })

    if (Object.keys(staffUserUpdates).length > 0) {
      await req.payload.update({
        collection: 'staff-users',
        id: String(req.user.id),
        data: staffUserUpdates,
        overrideAccess: true,
        req,
      })
    }

    await req.payload.create({
      collection: 'onboarding-events',
      data: {
        user: relIdNumber(req.user.id),
        assignment: relIdNumber(task.assignment),
        task: relIdNumber(task.id),
        actor: relIdNumber(req.user.id),
        eventType: 'task_completed',
      },
      overrideAccess: true,
      req,
    })

    if (body.status === 'complete' && taskAssignmentId) {
      await maybeAutoSubmitOnboardingAssignment(req.payload, {
        userId: req.user.id,
        assignmentId: taskAssignmentId,
        actorId: req.user.id,
        req,
      })
    }

    return Response.json({ task: updated, generatedDocumentIds, generatedDocuments })
  }) as PayloadHandler,
}

export const onboardingSubmitForReview: Endpoint = {
  path: '/onboarding/submit',
  method: 'post',
  handler: (async (req) => {
    if (!req.user) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    let body: z.infer<typeof submitSchema>
    try {
      body = submitSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const assignment = await req.payload.findByID({
      collection: 'onboarding-assignments',
      id: body.assignmentId,
      req,
    })
    const userId = typeof assignment.user === 'object' ? assignment.user?.id : assignment.user
    if (!userId || String(userId) !== String(req.user.id)) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    const submitted = await submitOnboardingAssignmentForReview(req.payload, {
      assignmentId: assignment.id,
      userId,
      actorId: req.user.id,
      req,
    })

    if (!submitted) {
      return Response.json({ error: 'already_submitted' }, { status: 409 })
    }

    return Response.json({ ok: true })
  }) as PayloadHandler,
}
