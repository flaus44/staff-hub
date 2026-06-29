import React from 'react'

import {
  getSectionAttentionCount,
  getSectionBadgeTone,
  SECTION_NAV,
} from './admin-command-meta'
import { AdminIcon, IconHome } from './admin-icons'
import { fetchAdminMetrics } from './admin-metrics'

export default async function AdminCommandNav() {
  const portalUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  let metrics: Awaited<ReturnType<typeof fetchAdminMetrics>> | null = null

  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })
    metrics = await fetchAdminMetrics(payload)
  } catch {
    // Nav may render without full payload context
  }

  return (
    <div className="cmd-nav">
      <a href={`${portalUrl}/dashboard`} className="cmd-nav__portal">
        <IconHome size="sm" />
        Staff portal
      </a>

      <p className="cmd-nav__label">Sections</p>
      <div className="cmd-nav__pills">
        {SECTION_NAV.map((section) => {
          const badgeCount = metrics ? getSectionAttentionCount(section.group, metrics) : 0
          const badgeTone = metrics ? getSectionBadgeTone(section.group, metrics) : null

          return (
            <a key={section.group} href={section.href} className="cmd-nav-pill" title={section.label}>
              <span className="cmd-nav-pill__icon">
                <AdminIcon name={section.icon} size="sm" />
              </span>
              <span className="cmd-nav-pill__label">{section.label}</span>
              {badgeCount > 0 && badgeTone && (
                <span className={`cmd-badge cmd-badge--${badgeTone}`}>{badgeCount}</span>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
