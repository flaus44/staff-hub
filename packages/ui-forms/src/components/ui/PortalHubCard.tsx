import React, { type CSSProperties } from 'react'

export interface TileAccent {
  bg: string
  fg: string
}

type TileBadgeTone = 'live' | 'warn' | 'critical' | 'accent'

interface PortalHubCardProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  accent: TileAccent
  calloutLabel?: string
  calloutTone?: TileBadgeTone
  badgeCount?: number
  className?: string
  locked?: boolean
  helperText?: string
}

export const PortalHubCard: React.FC<PortalHubCardProps> = ({
  icon,
  title,
  description,
  href,
  accent,
  calloutLabel,
  calloutTone = 'accent',
  badgeCount = 0,
  className = '',
  locked = false,
  helperText,
}) => {
  const accentStyle = {
    '--tile-accent-bg': accent.bg,
    '--tile-accent-fg': accent.fg,
  } as CSSProperties

  const tileClassName = `cmd-section-tile ${locked ? 'cmd-section-tile--locked' : ''} ${className}`.trim()
  const helper = helperText?.trim()

  const callout = calloutLabel?.trim()
  const showBadge = badgeCount > 0

  const content = (
    <>
      {locked ? (
        <span className="cmd-section-tile__lock" aria-hidden="true">
          <svg
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </span>
      ) : null}
      {callout ? (
        <span className={`cmd-section-tile__callout cmd-badge cmd-badge--${calloutTone}`}>
          {callout}
        </span>
      ) : null}
      {showBadge ? (
        <span className="cmd-section-tile__badge" aria-label={`${badgeCount} items pending`}>
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      ) : null}
      <span className="cmd-section-tile__icon">{icon}</span>
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
    <a
      href={href}
      className={tileClassName}
      style={accentStyle}
      title={description}
    >
      {content}
    </a>
  )
}
