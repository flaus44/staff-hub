import React, { type CSSProperties } from 'react'

import type { TileAccent } from './admin-command-meta'
import { AdminIcon, type AdminIconName } from './admin-icons'

export interface CmdSectionTileProps {
  href: string
  title: string
  description: string
  icon: AdminIconName
  accent: TileAccent
}

export function CmdSectionTile({
  href,
  title,
  description,
  icon,
  accent,
}: CmdSectionTileProps) {
  const accentStyle = {
    '--tile-accent-bg': accent.bg,
    '--tile-accent-fg': accent.fg,
  } as CSSProperties

  return (
    <a href={href} className="cmd-section-tile" style={accentStyle} title={description}>
      <span className="cmd-section-tile__icon">
        <AdminIcon name={icon} size="xl" variant="tile" />
      </span>
      <span className="cmd-section-tile__title">{title}</span>
    </a>
  )
}
