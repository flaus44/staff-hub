import React, { type CSSProperties } from 'react'

import { IconLock, PortalIcon } from '@/components/portal-icons'
import type { TileAccent } from '@/lib/portal-section-meta'
import type { PortalIconName } from '@/lib/portal-section-meta'

export interface PortalSectionTileProps {
  href: string
  title: string
  description: string
  icon: PortalIconName
  accent: TileAccent
  locked?: boolean
  helperText?: string
}

export function PortalSectionTile({
  href,
  title,
  description,
  icon,
  accent,
  locked = false,
  helperText,
}: PortalSectionTileProps) {
  const accentStyle = {
    '--tile-accent-bg': accent.bg,
    '--tile-accent-fg': accent.fg,
  } as CSSProperties

  const tileClassName = `cmd-section-tile ${locked ? 'cmd-section-tile--locked' : ''}`.trim()
  const helper = helperText?.trim()

  const content = (
    <>
      {locked ? (
        <span className="cmd-section-tile__lock" aria-hidden="true">
          <IconLock size="sm" />
        </span>
      ) : null}
      <span className="cmd-section-tile__icon">
        <PortalIcon name={icon} size="xl" variant="tile" />
      </span>
      <span className="cmd-section-tile__title">{title}</span>
      {helper ? <span className="cmd-section-tile__helper">{helper}</span> : null}
    </>
  )

  if (locked) {
    return (
      <div
        className={tileClassName}
        style={accentStyle}
        title={helper ? `${description}. ${helper}` : description}
        aria-disabled="true"
      >
        {content}
      </div>
    )
  }

  return (
    <a href={href} className={tileClassName} style={accentStyle} title={description}>
      {content}
    </a>
  )
}
