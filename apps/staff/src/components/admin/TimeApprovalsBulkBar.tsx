'use client'

import React from 'react'

import { Button } from '@flaus/ui-forms/Button'

interface TimeApprovalsBulkBarProps {
  count: number
  onApprove: () => void
  onReject: () => void
  onClear: () => void
  busy: boolean
}

export function TimeApprovalsBulkBar({
  count,
  onApprove,
  onReject,
  onClear,
  busy,
}: TimeApprovalsBulkBarProps) {
  if (count === 0) return null

  return (
    <div className="ta-bulk-bar" role="status">
      <span className="ta-bulk-bar__count">
        {count} selected
      </span>
      <div className="ta-bulk-bar__actions">
        <Button
          type="button"
          variant="primary"
          className="!min-h-[36px] !px-3 !py-1.5 !text-sm"
          onClick={onApprove}
          disabled={busy}
        >
          Bulk approve
        </Button>
        <Button
          type="button"
          variant="outline"
          className="!min-h-[36px] !px-3 !py-1.5 !text-sm"
          onClick={onReject}
          disabled={busy}
        >
          Bulk reject
        </Button>
        <button type="button" className="ta-bulk-bar__clear" onClick={onClear} disabled={busy}>
          Clear
        </button>
      </div>
    </div>
  )
}
