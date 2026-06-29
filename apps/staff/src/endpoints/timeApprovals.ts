import type { Endpoint, PayloadHandler, Where } from 'payload'
import { z } from 'zod'

import { adminOnly, adminOrManager } from '@/access/roles'
import { actorIdFromUser, requestMeta, writeAuditLog } from '@/lib/audit'
import {
  calcShiftDuration,
  formatAuDateShort,
  formatAuTime,
  formatDecimalHours,
} from '@/lib/shift-format'
import { toTimeApprovalQueueEntry } from '@/lib/time-approvals-dto'
import { approveTimeEntryRecord } from '@/lib/timesheet-approve'

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function buildQueueWhere(query: {
  status?: string
  from?: string
  to?: string
  userId?: string
  approvedOnly?: string
}): Where {
  const conditions: Where[] = []

  if (query.status && query.status !== 'all') {
    conditions.push({ status: { equals: query.status } })
  }

  if (query.approvedOnly === 'true' || query.approvedOnly === '1') {
    conditions.push({ status: { equals: 'approved' } })
  }

  if (query.from) {
    conditions.push({ clockIn: { greater_than_equal: query.from } })
  }

  if (query.to) {
    conditions.push({ clockIn: { less_than_equal: query.to } })
  }

  if (query.userId) {
    conditions.push({ user: { equals: query.userId } })
  }

  return conditions.length > 0 ? { and: conditions } : {}
}

function csvEscape(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const bulkApproveSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1),
  approved: z.boolean(),
  note: z.string().optional(),
})

export const timeApprovalsQueue: Endpoint = {
  path: '/portal/timesheets/queue',
  method: 'get',
  handler: (async (req) => {
    if (!adminOrManager({ req })) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    const query = req.query as {
      status?: string
      from?: string
      to?: string
      userId?: string
      page?: string
      limit?: string
    }

    const page = parsePositiveInt(query.page, 1)
    const limit = Math.min(parsePositiveInt(query.limit, 50), 200)

    const result = await req.payload.find({
      collection: 'time-entries',
      where: buildQueueWhere(query),
      sort: '-clockIn',
      page,
      limit,
      depth: 1,
      req,
    })

    return Response.json({
      docs: result.docs.map((doc) => toTimeApprovalQueueEntry(doc)),
      totalDocs: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
    })
  }) as PayloadHandler,
}

export const timeApprovalsBulkApprove: Endpoint = {
  path: '/portal/timesheets/bulk-approve',
  method: 'post',
  handler: (async (req) => {
    if (!adminOrManager({ req })) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    let body: z.infer<typeof bulkApproveSchema>
    try {
      body = bulkApproveSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    let updated = 0
    const skipped: { id: string | number; reason: string }[] = []

    for (const id of body.ids) {
      const result = await approveTimeEntryRecord(req.payload, req, {
        timeEntryId: id,
        approved: body.approved,
        note: body.note,
      })

      if (result.ok) {
        updated += 1
      } else {
        skipped.push({ id, reason: result.reason })
      }
    }

    return Response.json({ updated, skipped })
  }) as PayloadHandler,
}

export const timeApprovalsExport: Endpoint = {
  path: '/portal/timesheets/export',
  method: 'get',
  handler: (async (req) => {
    if (!adminOnly({ req })) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    const query = req.query as {
      status?: string
      from?: string
      to?: string
      userId?: string
      approvedOnly?: string
    }

    const approvedOnly = query.approvedOnly !== 'false' && query.approvedOnly !== '0'

    const result = await req.payload.find({
      collection: 'time-entries',
      where: buildQueueWhere({
        ...query,
        approvedOnly: approvedOnly ? 'true' : undefined,
        status: approvedOnly ? undefined : query.status,
      }),
      sort: '-clockIn',
      limit: 5000,
      depth: 1,
      req,
    })

    const header = [
      'Employee Name',
      'Xero Employee ID',
      'Email',
      'Date (DD/MM/YYYY)',
      'Clock In',
      'Clock Out',
      'Break (min)',
      'Net Hours (decimal)',
      'Project Tag',
      'Status',
      'Approved By',
      'Entry ID',
    ]

    const rows: string[] = [header.join(',')]

    for (const doc of result.docs) {
      const user = typeof doc.user === 'object' && doc.user !== null ? doc.user : null
      const approvedByUser =
        typeof doc.approvedBy === 'object' && doc.approvedBy !== null ? doc.approvedBy : null
      const breakMinutes = doc.breakMinutes ?? 0
      const duration = calcShiftDuration(doc.clockIn, doc.clockOut, breakMinutes)
      const netHours = duration ? formatDecimalHours(duration.netMinutes) : ''
      const employeeName = user
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        : ''
      const approvedByName = approvedByUser
        ? `${approvedByUser.firstName ?? ''} ${approvedByUser.lastName ?? ''}`.trim()
        : ''

      rows.push(
        [
          csvEscape(employeeName),
          csvEscape(user?.xeroEmployeeId ?? ''),
          csvEscape(user?.email ?? ''),
          csvEscape(formatAuDateShort(doc.clockIn)),
          csvEscape(formatAuTime(doc.clockIn)),
          csvEscape(doc.clockOut ? formatAuTime(doc.clockOut) : ''),
          csvEscape(breakMinutes),
          csvEscape(netHours),
          csvEscape(doc.projectTag ?? ''),
          csvEscape(doc.status ?? ''),
          csvEscape(approvedByName),
          csvEscape(doc.id),
        ].join(','),
      )
    }

    await writeAuditLog(req.payload, {
      actorId: actorIdFromUser(req.user as Parameters<typeof actorIdFromUser>[0]),
      action: 'export.csv',
      resourceType: 'time-entries',
      ...requestMeta(req),
      metadata: {
        count: result.docs.length,
        approvedOnly,
        from: query.from,
        to: query.to,
      },
    })

    const filename = `time-entries-${new Date().toISOString().slice(0, 10)}.csv`

    return new Response(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }) as PayloadHandler,
}
