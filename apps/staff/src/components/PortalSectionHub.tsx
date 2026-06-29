import Link from 'next/link'
import React from 'react'

import { IconChevronLeft, PortalIcon } from '@/components/portal-icons'
import { PortalHubCard } from '@flaus/ui-forms/PortalHubCard'
import {
  dimTileAccent,
  type PortalFeatureMeta,
  type PortalIconName,
  type TileAccent,
} from '@/lib/portal-section-meta'

export interface PortalSectionHubProps {
  backHref?: string
  backLabel?: string
  title: string
  description: string
  icon: PortalIconName
  accent: TileAccent
  features: PortalFeatureMeta[]
  lockedFeatureSlugs?: string[]
  lockedHelperText?: string
  trainingBadgeCount?: number
}

export function PortalSectionHub({
  backHref = '/dashboard',
  backLabel = 'Back to Home',
  title,
  description,
  icon,
  accent,
  features,
  lockedFeatureSlugs = [],
  lockedHelperText,
  trainingBadgeCount = 0,
}: PortalSectionHubProps) {
  const featureAccent = dimTileAccent(accent)

  return (
    <div className="portal-section-page">
      <Link href={backHref} className="portal-section-page__back">
        <IconChevronLeft size="sm" />
        {backLabel}
      </Link>

      <header className="portal-section-page__header">
        <span
          className="portal-section-page__icon"
          style={
            {
              '--tile-accent-bg': accent.bg,
              '--tile-accent-fg': accent.fg,
            } as React.CSSProperties
          }
        >
          <PortalIcon name={icon} size="md" variant="tile" />
        </span>
        <div>
          <h1 className="portal-section-page__title">{title}</h1>
          <p className="portal-section-page__description">{description}</p>
        </div>
      </header>

      <div className="cmd-control-grid">
        {features.map((feature) => {
          const locked = lockedFeatureSlugs.includes(feature.slug)
          const showCallout = Boolean(feature.calloutLabel)

          const badgeCount =
            feature.slug === 'training' && !locked && trainingBadgeCount > 0
              ? trainingBadgeCount
              : undefined

          return (
            <PortalHubCard
              key={feature.slug}
              href={feature.href}
              title={feature.title}
              description={feature.description}
              icon={<PortalIcon name={feature.icon} size="xl" variant="tile" />}
              accent={featureAccent}
              calloutLabel={showCallout ? feature.calloutLabel : undefined}
              calloutTone={feature.calloutTone}
              badgeCount={badgeCount}
              locked={locked}
              helperText={locked ? lockedHelperText : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
