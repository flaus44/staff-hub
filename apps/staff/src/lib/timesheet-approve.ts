import type { Payload, PayloadRequest } from 'payload'

import { actorIdFromUser, requestMeta, writeAuditLog } from '@/lib/audit'
import type { TimeEntry } from '@/payload-types'

export type ApproveTimeEntryResult =
  | { ok: true; entry: TimeEntry }
  | { ok: false; reason: 'not_found' | 'not_submitted' }

export async function approveTimeEntryRecord(
  payload: Payload,
  req: PayloadRequest,
  args: {
    timeEntryId: string | number
    approved: boolean
    note?: string
  },
): Promise<ApproveTimeEntryResult> {
  let entry: TimeEntry
  try {
    entry = await payload.findByID({
      collection: 'time-entries',
      id: args.timeEntryId,
      depth: 0,
      req,
    })
  } catch {
    return { ok: false, reason: 'not_found' }
  }

  if (entry.status !== 'submitted') {
    return { ok: false, reason: 'not_submitted' }
  }

  const updated = (await payload.update({
    collection: 'time-entries',
    id: args.timeEntryId,
    data: {
      status: args.approved ? 'approved' : 'rejected',
      approvalNote: args.note,
      approvedBy: req.user!.id,
    },
    req,
  })) as TimeEntry

  await writeAuditLog(payload, {
    actorId: actorIdFromUser(req.user as Parameters<typeof actorIdFromUser>[0]),
    action: 'timesheet.approve',
    resourceType: 'time-entries',
    resourceId: args.timeEntryId,
    ...requestMeta(req),
    metadata: { approved: args.approved },
  })

  return { ok: true, entry: updated }
}
