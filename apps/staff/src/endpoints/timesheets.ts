import type { Endpoint, PayloadHandler } from 'payload'
import { z } from 'zod'

import { adminOrManager, authenticated, relationId } from '@/access/roles'
import { approveTimeEntryRecord } from '@/lib/timesheet-approve'
import { firstBlockingReason, getOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { PROJECT_TAG_OPTIONS } from '@/lib/project-tags'

const clockOutSchema = z.object({
  timeEntryId: z.union([z.string(), z.number()]),
  breakMinutes: z.number().min(0).max(480).optional(),
  shiftNotes: z.object({
    activitiesDone: z.string().min(1),
    achievements: z.string().optional(),
    blockers: z.string().optional(),
    freeText: z.string().optional(),
  }),
})

const clockInSchema = z.object({
  projectTag: z.enum(PROJECT_TAG_OPTIONS),
})

export const clockIn: Endpoint = {
  path: '/portal/timesheets/clock-in',
  method: 'post',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    const eligibility = await getOnboardingEligibility(req.payload, String(req.user!.id), 'clock-in')
    if (!eligibility.canWork) {
      const reason = firstBlockingReason(eligibility)
      return Response.json(
        {
          error: reason?.code ?? 'onboarding_incomplete',
          message: reason?.message ?? 'Onboarding requirements must be completed before clocking in.',
          href: reason?.href ?? '/onboarding',
          blockReasons: eligibility.blockReasons,
        },
        { status: 403 },
      )
    }

    let projectTag: (typeof PROJECT_TAG_OPTIONS)[number]
    try {
      const raw = await req.json?.().catch(() => ({}))
      const body = clockInSchema.parse(raw ?? {})
      projectTag = body.projectTag
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const active = await req.payload.find({
      collection: 'time-entries',
      where: {
        and: [{ user: { equals: req.user!.id } }, { status: { equals: 'active' } }],
      },
      limit: 1,
    })

    if (active.docs.length > 0) {
      return Response.json({ error: 'already_clocked_in', entry: active.docs[0] }, { status: 409 })
    }

    const entry = await req.payload.create({
      collection: 'time-entries',
      data: {
        user: req.user!.id,
        clockIn: new Date().toISOString(),
        status: 'active',
        projectTag,
      },
      req,
    })

    return Response.json({ entry })
  }) as PayloadHandler,
}

export const clockOut: Endpoint = {
  path: '/portal/timesheets/clock-out',
  method: 'post',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    let body: z.infer<typeof clockOutSchema>
    try {
      body = clockOutSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const entry = await req.payload.findByID({
      collection: 'time-entries',
      id: body.timeEntryId,
      depth: 0,
      req,
    })

    const entryUserId = relationId(entry?.user)
    if (!entry || entryUserId !== String(req.user!.id)) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    if (entry.status !== 'active') {
      return Response.json({ error: 'not_active' }, { status: 400 })
    }

    const updated = await req.payload.update({
      collection: 'time-entries',
      id: entry.id,
      data: {
        clockOut: new Date().toISOString(),
        breakMinutes: body.breakMinutes ?? entry.breakMinutes ?? 0,
        status: 'submitted',
      },
      req,
    })

    await req.payload.create({
      collection: 'shift-notes',
      data: {
        timeEntry: entry.id,
        ...body.shiftNotes,
      },
      req,
    })

    return Response.json({ entry: updated })
  }) as PayloadHandler,
}

const approveSchema = z.object({
  timeEntryId: z.union([z.string(), z.number()]),
  approved: z.boolean(),
  note: z.string().optional(),
})

export const approveTimeEntry: Endpoint = {
  path: '/portal/timesheets/approve',
  method: 'post',
  handler: (async (req) => {
    if (!adminOrManager({ req })) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    let body: z.infer<typeof approveSchema>
    try {
      body = approveSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const result = await approveTimeEntryRecord(req.payload, req, {
      timeEntryId: body.timeEntryId,
      approved: body.approved,
      note: body.note,
    })

    if (!result.ok) {
      const status = result.reason === 'not_found' ? 404 : 400
      return Response.json({ error: result.reason }, { status })
    }

    return Response.json({ entry: result.entry })
  }) as PayloadHandler,
}
