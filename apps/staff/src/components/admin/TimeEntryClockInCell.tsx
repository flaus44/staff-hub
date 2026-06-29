'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

import { formatAuDate, formatAuTime } from '@/lib/shift-format'

export default function TimeEntryClockInCell({ cellData }: DefaultCellComponentProps) {
  if (!cellData || typeof cellData !== 'string') {
    return <span className="text-[var(--cmd-text-muted)]">—</span>
  }

  return (
    <span>
      {formatAuDate(cellData)} · {formatAuTime(cellData)}
    </span>
  )
}
