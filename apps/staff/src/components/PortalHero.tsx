import React from 'react'

interface PortalHeroProps {
  eyebrow: string
  title: string
  statusParts?: string[]
  adminHref?: string
}

export function PortalHero({ eyebrow, title, statusParts = [], adminHref }: PortalHeroProps) {
  return (
    <div className="portal-hero">
      <div className="portal-hero__glow" aria-hidden />
      <div className="portal-hero__content">
        <div className="portal-hero__top">
          <div>
            <p className="portal-hero__eyebrow">{eyebrow}</p>
            <h1 className="portal-hero__title">{title}</h1>
          </div>
          {adminHref && (
            <a href={adminHref} className="portal-hero__admin-link">
              Admin panel →
            </a>
          )}
        </div>
        {statusParts.length > 0 && <p className="portal-status">{statusParts.join(' · ')}</p>}
      </div>
    </div>
  )
}
