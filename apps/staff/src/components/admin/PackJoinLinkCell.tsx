'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

import { PackJoinLinkActions } from './PackJoinLinkActions'

export default function PackJoinLinkCell({ rowData }: DefaultCellComponentProps) {
  return (
    <PackJoinLinkActions
      slug={typeof rowData?.slug === 'string' ? rowData.slug : null}
      active={Boolean(rowData?.active)}
      compact
    />
  )
}
