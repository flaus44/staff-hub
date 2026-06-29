import React from 'react'

import { PortalCard } from './PortalCard'

interface ActionTileProps {
  eyebrow: string
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode
  variant?: 'default' | 'warning'
}

export const ActionTile: React.FC<ActionTileProps> = ({
  eyebrow,
  icon,
  title,
  description,
  action,
  variant = 'warning',
}) => {
  return (
    <PortalCard eyebrow={eyebrow} variant={variant} padding="md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(62,106,225,0.15)] text-[var(--cmd-accent)]">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--cmd-text)] truncate">{title}</p>
            <p className="text-sm text-[var(--cmd-text-muted)] mt-0.5">{description}</p>
          </div>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </PortalCard>
  )
}
