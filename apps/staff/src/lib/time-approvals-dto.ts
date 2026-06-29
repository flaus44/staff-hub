import { relationId } from '@/access/roles'
import {
  calcShiftDuration,
  formatAuDate,
  formatAuDateShort,
  formatAuTime,
  formatWorkedDuration,
} from '@/lib/shift-format'

type StaffUserRef = {
  id?: string | number
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  xeroEmployeeId?: string | null
}

type TimeEntryDoc = {
  id: string | number
  status?: string | null
  projectTag?: string | null
  breakMinutes?: number | null
  clockIn: string
  clockOut?: string | null
  approvedAt?: string | null
  updatedAt?: string
  user?: StaffUserRef | string | number | null
  approvedBy?: StaffUserRef | string | number | null
}

export type TimeApprovalQueueEntry = {
  id: string | number
  status: string
  projectTag: string
  breakMinutes: number
  employee: {
    id: string | null
    firstName: string
    lastName: string
    email: string
    xeroEmployeeId: string | null
  }
  clockIn: string
  clockOut: string | null
  dateLabel: string
  clockInLabel: string
  clockOutLabel: string | null
  hoursLabel: string | null
  approvedBy: { name: string; at: string; atLabel: string } | null
}

function staffName(user: StaffUserRef | null | undefined): string {
  if (!user) return ''
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
}

export function toTimeApprovalQueueEntry(doc: TimeEntryDoc): TimeApprovalQueueEntry {
  const user = typeof doc.user === 'object' && doc.user !== null ? doc.user : null
  const approvedByUser =
    typeof doc.approvedBy === 'object' && doc.approvedBy !== null ? doc.approvedBy : null
  const breakMinutes = doc.breakMinutes ?? 0
  const duration = calcShiftDuration(doc.clockIn, doc.clockOut, breakMinutes)
  const approvedAt =
    doc.approvedAt ??
    (doc.status === 'approved' && doc.updatedAt ? doc.updatedAt : null)

  return {
    id: doc.id,
    status: doc.status ?? 'active',
    projectTag: doc.projectTag ?? '',
    breakMinutes,
    employee: {
      id: relationId(doc.user),
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      xeroEmployeeId: user?.xeroEmployeeId ?? null,
    },
    clockIn: doc.clockIn,
    clockOut: doc.clockOut ?? null,
    dateLabel: formatAuDate(doc.clockIn),
    clockInLabel: formatAuTime(doc.clockIn),
    clockOutLabel: doc.clockOut ? formatAuTime(doc.clockOut) : null,
    hoursLabel: duration ? formatWorkedDuration(duration) : null,
    approvedBy:
      approvedByUser && approvedAt
        ? {
            name: staffName(approvedByUser),
            at: approvedAt,
            atLabel: formatAuDateShort(approvedAt),
          }
        : null,
  }
}
