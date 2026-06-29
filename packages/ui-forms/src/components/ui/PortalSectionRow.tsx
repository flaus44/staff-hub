import React from 'react'

interface PortalSectionRowProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  badgeCount?: number
  badgeTone?: 'live' | 'warn' | 'critical' | null
  className?: string
}

export const PortalSectionRow: React.FC<PortalSectionRowProps> = ({
  icon,
  title,
  description,
  href,
  badgeCount = 0,
  badgeTone,
  className = '',
}) => {
  return (
    <a href={href} className={`portal-section-row ${className}`.trim()}>
      <span className="portal-section-row__icon">{icon}</span>
      <span className="portal-section-row__body">
        <span className="portal-section-row__title">{title}</span>
        <span className="portal-section-row__description">{description}</span>
      </span>
      <span className="portal-section-row__meta">
        {badgeCount > 0 && badgeTone && (
          <span className={`portal-badge portal-badge--${badgeTone}`}>{badgeCount}</span>
        )}
        <span className="portal-section-row__chevron" aria-hidden>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </span>
    </a>
  )
}
