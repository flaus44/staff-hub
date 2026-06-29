'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

import { formatAuTime } from '@/lib/shift-format'

export default function TimeEntryClockOutCell({ cellData }: DefaultCellComponentProps) {
  if (!cellData || typeof cellData !== 'string') {
    return <span className="text-[var(--cmd-text-muted)]">—</span>
  }

  return <span>{formatAuTime(cellData)}</span>
}
