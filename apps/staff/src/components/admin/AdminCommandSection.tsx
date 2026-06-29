'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'

import {
  dimTileAccent,
  getCollectionsByGroup,
  isCommandGroup,
  SECTION_META,
  type CommandGroup,
} from './admin-command-meta'
import { AdminIcon, IconChevronLeft } from './admin-icons'
import { CmdSectionTile } from './CmdSectionTile'

export default function AdminCommandSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupParam = searchParams.get('group')
  const group = isCommandGroup(groupParam) ? groupParam : null

  useEffect(() => {
    if (!group) {
      router.replace('/admin')
    }
  }, [group, router])

  if (!group) {
    return null
  }

  return <SectionPage group={group} />
}

function SectionPage({ group }: { group: CommandGroup }) {
  const meta = SECTION_META[group]
  const collections = getCollectionsByGroup(group)

  return (
    <div className="cmd-section-page">
      <a href="/admin" className="cmd-section-page__back">
        <IconChevronLeft size="sm" />
        Back to Command
      </a>

      <header className="cmd-section-page__header">
        <span
          className="cmd-section-page__icon"
          style={
            {
              '--tile-accent-bg': meta.accent.bg,
              '--tile-accent-fg': meta.accent.fg,
            } as React.CSSProperties
          }
        >
          <AdminIcon name={meta.icon} size="md" variant="tile" />
        </span>
        <div>
          <h1 className="cmd-section-page__title">{meta.title}</h1>
          <p className="cmd-section-page__description">{meta.description}</p>
        </div>
      </header>

      <div className="cmd-control-grid">
        {collections.map((col) => (
          <CmdSectionTile
            key={col.slug}
            href={col.href ?? `/admin/collections/${col.slug}`}
            title={col.title}
            description={col.description}
            icon={col.icon}
            accent={dimTileAccent(meta.accent)}
          />
        ))}
      </div>
    </div>
  )
}
