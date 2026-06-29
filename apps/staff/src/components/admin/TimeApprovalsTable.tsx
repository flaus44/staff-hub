'use client'

import React from 'react'

import { Button } from '@flaus/ui-forms/Button'
import { StatusPill } from '@flaus/ui-forms/StatusPill'

import type { TimeApprovalQueueEntry } from '@/lib/time-approvals-dto'

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Active',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
  }
  return labels[status] ?? status
}

function statusVariant(status: string): 'success' | 'warning' | 'info' | 'neutral' | 'danger' {
  if (status === 'approved') return 'success'
  if (status === 'active') return 'info'
  if (status === 'rejected') return 'danger'
  if (status === 'submitted') return 'warning'
  return 'neutral'
}

interface TimeApprovalsTableProps {
  docs: TimeApprovalQueueEntry[]
  selectedIds: Set<string | number>
  onToggle: (id: string | number) => void
  onToggleAll: (checked: boolean) => void
  onApprove: (id: string | number) => void
  onReject: (id: string | number) => void
  busyId: string | number | null
  statusTab: string
}

export function TimeApprovalsTable({
  docs,
  selectedIds,
  onToggle,
  onToggleAll,
  onApprove,
  onReject,
  busyId,
  statusTab,
}: TimeApprovalsTableProps) {
  const submittedDocs = docs.filter((d) => d.status === 'submitted')
  const allSubmittedSelected =
    submittedDocs.length > 0 && submittedDocs.every((d) => selectedIds.has(d.id))

  if (docs.length === 0) {
    const emptyMessage =
      statusTab === 'submitted'
        ? 'No pending submissions'
        : statusTab === 'approved'
          ? 'No approved entries this period'
          : statusTab === 'rejected'
            ? 'No rejected entries this period'
            : 'No time entries match your filters'

    return (
      <div className="ta-empty">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="ta-table-wrap">
      <table className="ta-table">
        <thead>
          <tr>
            <th className="ta-table__check">
              <input
                type="checkbox"
                aria-label="Select all pending rows"
                checked={allSubmittedSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
              />
            </th>
            <th>Employee</th>
            <th>Date</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Hours</th>
            <th>Break</th>
            <th>Status</th>
            <th>Approved</th>
            <th>Project</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((entry) => {
            const employeeName =
              `${entry.employee.firstName} ${entry.employee.lastName}`.trim() ||
              entry.employee.email
            const isSubmitted = entry.status === 'submitted'
            const isBusy = busyId === entry.id

            return (
              <tr key={entry.id} className={selectedIds.has(entry.id) ? 'ta-table__row--selected' : ''}>
                <td className="ta-table__check">
                  {isSubmitted ? (
                    <input
                      type="checkbox"
                      aria-label={`Select ${employeeName}`}
                      checked={selectedIds.has(entry.id)}
                      onChange={() => onToggle(entry.id)}
                    />
                  ) : null}
                </td>
                <td>
                  <div className="ta-table__employee">
                    <strong>{employeeName}</strong>
                    <span>{entry.employee.email}</span>
                  </div>
                </td>
                <td>{entry.dateLabel}</td>
                <td>{entry.clockInLabel}</td>
                <td>{entry.clockOutLabel ?? '—'}</td>
                <td>{entry.hoursLabel ?? '—'}</td>
                <td>{entry.breakMinutes > 0 ? `${entry.breakMinutes} min` : '—'}</td>
                <td>
                  <StatusPill status={statusLabel(entry.status)} variant={statusVariant(entry.status)} />
                </td>
                <td>
                  {entry.approvedBy ? (
                    <span className="ta-table__approved">
                      ✓ {entry.approvedBy.name} · {entry.approvedBy.atLabel}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{entry.projectTag || '—'}</td>
                <td>
                  {isSubmitted ? (
                    <div className="ta-table__actions">
                      <Button
                        type="button"
                        variant="primary"
                        className="!min-h-[32px] !px-2.5 !py-1 !text-xs"
                        disabled={isBusy}
                        onClick={() => onApprove(entry.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="!min-h-[32px] !px-2.5 !py-1 !text-xs"
                        disabled={isBusy}
                        onClick={() => onReject(entry.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
