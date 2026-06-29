'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { Button } from '@flaus/ui-forms/Button'
import { SkeletonList } from '@flaus/ui-forms/Skeleton'
import { TextArea } from '@flaus/ui-forms/TextArea'

import type { TimeApprovalQueueEntry } from '@/lib/time-approvals-dto'

import { TimeApprovalsBulkBar } from './TimeApprovalsBulkBar'
import { TimeApprovalsTable } from './TimeApprovalsTable'
import { TimeApprovalsToolbar, type StatusTab } from './TimeApprovalsToolbar'
import { AdminIcon } from './admin-icons'

type PendingAction = {
  mode: 'single' | 'bulk'
  approved: boolean
  ids: (string | number)[]
}

function toIsoDateStart(date: string): string | undefined {
  if (!date) return undefined
  return new Date(`${date}T00:00:00`).toISOString()
}

function toIsoDateEnd(date: string): string | undefined {
  if (!date) return undefined
  return new Date(`${date}T23:59:59.999`).toISOString()
}

export default function TimeApprovalsView() {
  const [status, setStatus] = useState<StatusTab>('submitted')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [docs, setDocs] = useState<TimeApprovalQueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())
  const [busyId, setBusyId] = useState<string | number | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [note, setNote] = useState('')

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (from) params.set('from', toIsoDateStart(from) ?? from)
    if (to) params.set('to', toIsoDateEnd(to) ?? to)
    params.set('limit', '200')

    try {
      const res = await fetch(`/api/portal/timesheets/queue?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to load queue')
      }
      const data = await res.json()
      setDocs(data.docs ?? [])
      setSelectedIds(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue')
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [status, from, to])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  function toggleSelection(id: string | number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelectedIds(new Set())
      return
    }
    const submitted = docs.filter((d) => d.status === 'submitted').map((d) => d.id)
    setSelectedIds(new Set(submitted))
  }

  function optimisticUpdate(ids: (string | number)[], approved: boolean) {
    const newStatus = approved ? 'approved' : 'rejected'
    setDocs((prev) =>
      prev.map((entry) =>
        ids.includes(entry.id)
          ? {
              ...entry,
              status: newStatus,
              approvedBy: null,
            }
          : entry,
      ),
    )
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.delete(id)
      return next
    })
  }

  async function runSingleApprove(id: string | number, approved: boolean, approvalNote?: string) {
    setBusyId(id)
    const previous = docs
    optimisticUpdate([id], approved)

    try {
      const res = await fetch('/api/portal/timesheets/approve', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeEntryId: id, approved, note: approvalNote }),
      })
      if (!res.ok) {
        setDocs(previous)
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Approval failed')
      }
      await loadQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setBusyId(null)
    }
  }

  async function runBulkApprove(ids: (string | number)[], approved: boolean, approvalNote?: string) {
    setBulkBusy(true)
    const previous = docs
    optimisticUpdate(ids, approved)

    try {
      const res = await fetch('/api/portal/timesheets/bulk-approve', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, approved, note: approvalNote }),
      })
      if (!res.ok) {
        setDocs(previous)
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Bulk approval failed')
      }
      await loadQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk approval failed')
    } finally {
      setBulkBusy(false)
    }
  }

  function openAction(action: PendingAction) {
    setNote('')
    setPendingAction(action)
  }

  function confirmAction() {
    if (!pendingAction) return
    const { mode, approved, ids } = pendingAction
    setPendingAction(null)
    if (mode === 'single' && ids[0] != null) {
      void runSingleApprove(ids[0], approved, note.trim() || undefined)
    } else {
      void runBulkApprove(ids, approved, note.trim() || undefined)
    }
  }

  async function handleExport() {
    setExporting(true)
    setError('')

    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (from) params.set('from', toIsoDateStart(from) ?? from)
    if (to) params.set('to', toIsoDateEnd(to) ?? to)
    params.set('approvedOnly', status === 'approved' ? 'true' : 'false')

    try {
      const res = await fetch(`/api/portal/timesheets/export?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Export failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `time-entries-${new Date().toISOString().slice(0, 10)}.csv`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const selectedList = Array.from(selectedIds)

  return (
    <div className="cmd-section-page ta-page">
      <a href="/admin/command?group=Timesheets" className="cmd-section-page__back">
        ← Back to Timesheets
      </a>

      <header className="cmd-section-page__header">
        <span
          className="cmd-section-page__icon"
          style={
            {
              '--tile-accent-bg': 'rgba(45, 212, 191, 0.15)',
              '--tile-accent-fg': '#2dd4bf',
            } as React.CSSProperties
          }
        >
          <AdminIcon name="check-circle" size="md" variant="tile" />
        </span>
        <div>
          <h1 className="cmd-section-page__title">Time Approvals</h1>
          <p className="cmd-section-page__description">
            Review submitted timesheets, approve individually or in bulk, and export approved hours
            for Xero payroll.
          </p>
        </div>
      </header>

      <TimeApprovalsToolbar
        status={status}
        from={from}
        to={to}
        onStatusChange={setStatus}
        onFromChange={setFrom}
        onToChange={setTo}
        onExport={handleExport}
        exporting={exporting}
      />

      {error ? <p className="ta-error">{error}</p> : null}

      <TimeApprovalsBulkBar
        count={selectedList.length}
        busy={bulkBusy}
        onClear={() => setSelectedIds(new Set())}
        onApprove={() =>
          openAction({ mode: 'bulk', approved: true, ids: selectedList })
        }
        onReject={() =>
          openAction({ mode: 'bulk', approved: false, ids: selectedList })
        }
      />

      {loading ? (
        <SkeletonList rows={6} />
      ) : (
        <TimeApprovalsTable
          docs={docs}
          selectedIds={selectedIds}
          onToggle={toggleSelection}
          onToggleAll={toggleAll}
          busyId={busyId}
          statusTab={status}
          onApprove={(id) => openAction({ mode: 'single', approved: true, ids: [id] })}
          onReject={(id) => openAction({ mode: 'single', approved: false, ids: [id] })}
        />
      )}

      {pendingAction ? (
        <div className="ta-modal-backdrop" role="presentation" onClick={() => setPendingAction(null)}>
          <div
            className="ta-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ta-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="ta-modal-title" className="ta-modal__title">
              {pendingAction.approved ? 'Approve' : 'Reject'}{' '}
              {pendingAction.mode === 'bulk'
                ? `${pendingAction.ids.length} entries`
                : 'time entry'}
              ?
            </h2>
            <p className="ta-modal__hint">Optional note for the employee or audit trail.</p>
            <TextArea
              id="approval-note"
              label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Approval note (optional)"
              rows={3}
            />
            <div className="ta-modal__actions">
              <Button type="button" variant="secondary" onClick={() => setPendingAction(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={pendingAction.approved ? 'primary' : 'outline'}
                onClick={confirmAction}
              >
                Confirm {pendingAction.approved ? 'approve' : 'reject'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
