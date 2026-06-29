'use client'

import React from 'react'

import { Button } from '@flaus/ui-forms/Button'

export type StatusTab = 'all' | 'submitted' | 'approved' | 'rejected'

const TABS: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'submitted', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

interface TimeApprovalsToolbarProps {
  status: StatusTab
  from: string
  to: string
  onStatusChange: (status: StatusTab) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onExport: () => void
  exporting: boolean
}

export function TimeApprovalsToolbar({
  status,
  from,
  to,
  onStatusChange,
  onFromChange,
  onToChange,
  onExport,
  exporting,
}: TimeApprovalsToolbarProps) {
  return (
    <div className="ta-toolbar">
      <div className="ta-toolbar__tabs" role="tablist" aria-label="Filter by status">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={status === tab.id}
            className={`ta-toolbar__tab ${status === tab.id ? 'ta-toolbar__tab--active' : ''}`}
            onClick={() => onStatusChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ta-toolbar__filters">
        <label className="ta-toolbar__date">
          <span>From</span>
          <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
        </label>
        <label className="ta-toolbar__date">
          <span>To</span>
          <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
        </label>
        <Button
          type="button"
          variant="secondary"
          className="ta-toolbar__export !min-h-[36px] !px-3 !py-1.5 !text-sm"
          onClick={onExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      <p className="ta-toolbar__hint">
        Import the exported CSV into Xero via UpSheets or Zed Axis.
      </p>
    </div>
  )
}
