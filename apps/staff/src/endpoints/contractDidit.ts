import type { Endpoint, PayloadHandler } from 'payload'
import { z } from 'zod'

import { authenticated } from '@/access/roles'
import { diditClient, getDiditSessionDecision, isDiditConfigured, normaliseDiditStatus } from '@/lib/didit'
import { toDiditMobilePhone } from '@/lib/phone'

const sessionSchema = z.object({
  contractId: z.union([z.string(), z.number()]),
  formValues: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  draftId: z.union([z.string(), z.number()]),
})

const statusSchema = z.object({
  draftId: z.union([z.string(), z.number()]),
})

import { contractRequiresDidit } from '@/lib/contract-didit'
import { profileUpdatesFromContractForm } from '@/lib/contract-form'

export const contractDiditSession: Endpoint = {
  path: '/portal/contracts/didit/session',
  method: 'post',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    if (!isDiditConfigured()) {
      return Response.json({ error: 'didit_not_configured' }, { status: 503 })
    }

    let body: z.infer<typeof sessionSchema>
    try {
      body = sessionSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const contract = await req.payload.findByID({
      collection: 'contracts',
      id: body.contractId,
      depth: 0,
    })

    if (!contract) return Response.json({ error: 'not_found' }, { status: 404 })
    if (!contractRequiresDidit(contract)) {
      return Response.json({ error: 'didit_not_required' }, { status: 400 })
    }

    const draft = await req.payload.findByID({
      collection: 'contract-signing-drafts',
      id: body.draftId,
      depth: 0,
    })

    if (!draft) return Response.json({ error: 'draft_not_found' }, { status: 404 })

    const draftUserId = typeof draft.user === 'object' ? draft.user?.id : draft.user
    const draftContractId = typeof draft.contract === 'object' ? draft.contract?.id : draft.contract

    if (String(draftUserId) !== String(req.user!.id) || String(draftContractId) !== String(contract.id)) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    if (!draft.onboardingConfirmedAt) {
      return Response.json({ error: 'onboarding_confirmation_required' }, { status: 400 })
    }

    const formValues = (body.formValues ?? draft.formResponses ?? {}) as Record<string, string>
    const firstName = String(formValues.firstName ?? '').trim()
    const lastName = String(formValues.lastName ?? '').trim()
    const email = String(formValues.email ?? '').trim()
    const mobile = String(formValues.mobile ?? '')

    if (!firstName || !lastName || !email) {
      return Response.json({ error: 'missing_contact_fields' }, { status: 400 })
    }

    if (!toDiditMobilePhone(mobile)) {
      return Response.json(
        { error: 'Please enter an Australian mobile number, like 0412 345 678.' },
        { status: 400 },
      )
    }

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

    await req.payload.update({
      collection: 'contract-signing-drafts',
      id: draft.id,
      data: {
        formResponses: formValues,
        verificationStatus: 'pending',
        expiresAt,
      },
      overrideAccess: true,
      req,
    })

    const profile = profileUpdatesFromContractForm(formValues)
    if (Object.keys(profile).length > 0) {
      await req.payload.update({
        collection: 'staff-users',
        id: String(req.user!.id),
        data: { profile },
        overrideAccess: true,
        req,
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const redirectUrl = `${baseUrl}/contracts/${contract.id}/sign?draftId=${draft.id}`

    try {
      const session = await diditClient.createStaffContractSession({
        draftId: draft.id,
        contractId: contract.id,
        userId: req.user!.id,
        firstName,
        lastName,
        email,
        mobile,
        address: String(formValues.address ?? ''),
        state: String(formValues.state ?? ''),
        postcode: String(formValues.postcode ?? ''),
        redirectUrl,
      })

      await req.payload.update({
        collection: 'contract-signing-drafts',
        id: draft.id,
        data: { diditSessionId: session.sessionId },
        req,
      })

      return Response.json({
        sessionUrl: session.url,
        draftId: draft.id,
        diditSessionId: session.sessionId,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create Didit session'
      return Response.json({ error: message }, { status: 500 })
    }
  }) as PayloadHandler,
}

export const contractDiditStatus: Endpoint = {
  path: '/portal/contracts/didit/status',
  method: 'post',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    let body: z.infer<typeof statusSchema>
    try {
      body = statusSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const draft = await req.payload.findByID({
      collection: 'contract-signing-drafts',
      id: body.draftId,
      depth: 0,
    })

    if (!draft) return Response.json({ error: 'not_found' }, { status: 404 })

    const draftUserId = typeof draft.user === 'object' ? draft.user?.id : draft.user
    if (String(draftUserId) !== String(req.user!.id)) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    if (draft.verificationStatus === 'approved') {
      return Response.json({
        status: 'Approved',
        draftId: draft.id,
        formValues: draft.formResponses,
        diditSessionId: draft.diditSessionId,
      })
    }

    if (!draft.diditSessionId) {
      return Response.json({ status: 'Pending', draftId: draft.id })
    }

    try {
      const decision = await getDiditSessionDecision(draft.diditSessionId)
      const { status, reason } = normaliseDiditStatus(decision.status)

      const statusMap = {
        Approved: 'approved',
        Declined: 'declined',
        Expired: 'expired',
        Pending: 'pending',
      } as const

      const verificationStatus = statusMap[status]

      if (verificationStatus !== 'pending') {
        await req.payload.update({
          collection: 'contract-signing-drafts',
          id: draft.id,
          data: {
            verificationStatus,
            diditVerification: decision,
          },
          req,
        })
      }

      return Response.json({
        status,
        reason,
        rawStatus: decision.status,
        draftId: draft.id,
        diditSessionId: draft.diditSessionId,
        formValues: status === 'Approved' ? draft.formResponses : undefined,
      })
    } catch {
      return Response.json({
        status: 'Pending',
        reason: 'Unable to check verification status. Retrying…',
        draftId: draft.id,
      })
    }
  }) as PayloadHandler,
}
