import type { Endpoint, Payload, PayloadHandler, PayloadRequest } from 'payload'
import { z } from 'zod'

import { authenticated } from '@/access/roles'
import { actorIdFromUser, requestMeta, writeAuditLog } from '@/lib/audit'
import { sha256Hex } from '@/lib/esign'
import {
  contactFieldIds,
  extractContactAnswers,
  SESSION_CAPTURE_ATTESTATIONS,
  stripContactFields,
  type SurveyField,
} from '@/lib/survey-field'
import { hasCriticalPiiFlags, scanAnswersForPii } from '@/lib/pii-scan'
import { SESSION_CAPTURE_LIVE_SLUG } from '@/lib/session-capture-fields'
import { assertCoDesignTrainingComplete, isLiveSessionCaptureTemplate } from '@/lib/training-gate'

const draftSchema = z.object({
  assignmentId: z.union([z.string(), z.number()]),
  answers: z.record(z.unknown()),
  currentStep: z.number().int().min(0),
})

const submitSchema = z.object({
  assignmentId: z.union([z.string(), z.number()]),
  answers: z.record(z.unknown()),
  attestations: z.record(z.boolean()).optional(),
  timeEntryId: z.union([z.string(), z.number()]).optional(),
})

async function provisionLiveSessionAssignment(
  payload: Payload,
  userId: string,
  req: PayloadRequest,
): Promise<void> {
  const liveTemplate = await payload.find({
    collection: 'survey-templates',
    where: { slug: { equals: SESSION_CAPTURE_LIVE_SLUG } },
    limit: 1,
    overrideAccess: true,
    req,
  })
  const tpl = liveTemplate.docs[0]
  if (!tpl) return

  const existing = await payload.find({
    collection: 'survey-assignments',
    where: {
      and: [
        { assignee: { equals: userId } },
        { template: { equals: String(tpl.id) } },
        { status: { not_equals: 'complete' } },
      ],
    },
    limit: 1,
    overrideAccess: true,
    req,
  })
  if (existing.docs.length > 0) return

  await payload.create({
    collection: 'survey-assignments',
    data: {
      assignee: userId,
      template: tpl.id,
      status: 'pending',
      sessionLabel: 'Live session capture',
    },
    overrideAccess: true,
    req,
  })
}

export const saveSurveyDraft: Endpoint = {
  path: '/portal/surveys/draft',
  method: 'post',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const parsed = draftSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'invalid_body' }, { status: 400 })
    }

    const userId = String(req.user!.id)
    const assignment = await req.payload.findByID({
      collection: 'survey-assignments',
      id: parsed.data.assignmentId,
      depth: 0,
    })

    if (!assignment || String(assignment.assignee) !== userId) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    const existing = await req.payload.find({
      collection: 'survey-response-drafts',
      where: {
        and: [
          { assignment: { equals: String(parsed.data.assignmentId) } },
          { respondent: { equals: userId } },
        ],
      },
      limit: 1,
      overrideAccess: true,
      req,
    })

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const data = {
      assignment: parsed.data.assignmentId,
      respondent: userId,
      answers: parsed.data.answers,
      currentStep: parsed.data.currentStep,
      expiresAt,
    }

    if (existing.docs[0]) {
      await req.payload.update({
        collection: 'survey-response-drafts',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
        req,
      })
    } else {
      await req.payload.create({
        collection: 'survey-response-drafts',
        data,
        overrideAccess: true,
        req,
      })
    }

    if (assignment.status === 'pending') {
      await req.payload.update({
        collection: 'survey-assignments',
        id: parsed.data.assignmentId,
        data: { status: 'in_progress' },
        overrideAccess: true,
        req,
      })
    }

    return Response.json({ ok: true })
  }) as PayloadHandler,
}

export const submitSurveyCapture: Endpoint = {
  path: '/portal/surveys/submit',
  method: 'post',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'invalid_body' }, { status: 400 })
    }

    const userId = String(req.user!.id)
    const assignment = await req.payload.findByID({
      collection: 'survey-assignments',
      id: parsed.data.assignmentId,
      depth: 2,
      overrideAccess: true,
      req,
    })

    if (!assignment || String(assignment.assignee) !== userId) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    const template =
      typeof assignment.template === 'object' ? assignment.template : null
    if (!template) {
      return Response.json({ error: 'template_missing' }, { status: 400 })
    }

    const isLiveCapture = await isLiveSessionCaptureTemplate(req.payload, template.id)
    if (isLiveCapture) {
      const gate = await assertCoDesignTrainingComplete(req.payload, userId)
      if (!gate.allowed) {
        return Response.json(
          { error: gate.reason, missingSlugs: gate.missingSlugs },
          { status: 403 },
        )
      }

      const missingAttestations = SESSION_CAPTURE_ATTESTATIONS.filter(
        (a) => a.required && !parsed.data.attestations?.[a.id],
      )
      if (missingAttestations.length > 0) {
        return Response.json(
          {
            error: 'attestations_required',
            missing: missingAttestations.map((a) => a.id),
          },
          { status: 400 },
        )
      }
    }

    const fields = (template.fields as SurveyField[]) ?? []
    const contactIds = contactFieldIds(fields)
    const s7Field = fields.find((f) => f.id.endsWith('s7_wants_program'))
    const s7Yes = s7Field ? String(parsed.data.answers[s7Field.id] ?? '') === 'yes' : false

    if (s7Yes && contactIds.every((id) => !parsed.data.answers[id])) {
      return Response.json({ error: 'section_8_required' }, { status: 400 })
    }
    if (!s7Yes && contactIds.some((id) => parsed.data.answers[id])) {
      return Response.json({ error: 'section_8_not_allowed' }, { status: 400 })
    }

    const researchAnswers = stripContactFields(parsed.data.answers, contactIds)
    const contactAnswers = extractContactAnswers(parsed.data.answers, contactIds)
    const piiFlags = scanAnswersForPii(researchAnswers)
    const hasContact = Object.keys(contactAnswers).length > 0

    if (hasCriticalPiiFlags(piiFlags, hasContact)) {
      return Response.json({ error: 'pii_flags', flags: piiFlags }, { status: 400 })
    }

    const meta = requestMeta(req)
    const submittedAt = new Date().toISOString()
    const captureMode =
      template.formKind === 'session_capture' ? template.captureMode ?? 'live' : undefined

    const response = await req.payload.create({
      collection: 'survey-responses',
      data: {
        assignment: parsed.data.assignmentId,
        template: template.id,
        respondent: userId,
        answers: researchAnswers,
        submittedAt,
        timeEntry: parsed.data.timeEntryId ?? assignment.timeEntry ?? undefined,
        captureMode,
        piiFlags,
        attestations: parsed.data.attestations ?? {},
        formVersion: template.formVersion ?? String(template.version ?? '1'),
      },
      overrideAccess: true,
      req,
    })

    if (hasContact) {
      await req.payload.create({
        collection: 'session-contact-details',
        data: {
          sessionResponse: response.id,
          facilitator: userId,
          contactAnswers,
          submittedAt,
          formVersion: template.formVersion ?? '2.0',
        },
        overrideAccess: true,
        req,
      })
    }

    await req.payload.update({
      collection: 'survey-assignments',
      id: parsed.data.assignmentId,
      data: { status: 'complete' },
      overrideAccess: true,
      req,
    })

    const drafts = await req.payload.find({
      collection: 'survey-response-drafts',
      where: {
        and: [
          { assignment: { equals: String(parsed.data.assignmentId) } },
          { respondent: { equals: userId } },
        ],
      },
      limit: 5,
      overrideAccess: true,
      req,
    })
    await Promise.all(
      drafts.docs.map((d) =>
        req.payload.delete({
          collection: 'survey-response-drafts',
          id: d.id,
          overrideAccess: true,
          req,
        }),
      ),
    )

    if (captureMode === 'practice') {
      const practiceModule = await req.payload.find({
        collection: 'training-modules',
        where: { slug: { equals: 'codesign-practice-capture' } },
        limit: 1,
        overrideAccess: true,
        req,
      })
      const mod = practiceModule.docs[0]
      if (mod) {
        const existing = await req.payload.find({
          collection: 'training-completions',
          where: {
            and: [{ user: { equals: userId } }, { module: { equals: String(mod.id) } }],
          },
          limit: 1,
          overrideAccess: true,
          req,
        })
        if (existing.docs.length === 0) {
          await req.payload.create({
            collection: 'training-completions',
            data: {
              user: userId,
              module: mod.id,
              completedAt: submittedAt,
              linkedSurveyResponseId: String(response.id),
              contentHash: sha256Hex(JSON.stringify(researchAnswers)),
              ipAddress: meta.ip,
              userAgent: meta.userAgent,
            },
            overrideAccess: true,
            req,
          })
        }
      }

      await provisionLiveSessionAssignment(req.payload, userId, req)
    }

    await writeAuditLog(req.payload, {
      actorId: actorIdFromUser(req.user),
      action: 'survey.submit',
      resourceType: 'survey-responses',
      resourceId: response.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { captureMode, templateSlug: template.slug },
    })

    return Response.json({ ok: true, responseId: response.id })
  }) as PayloadHandler,
}
