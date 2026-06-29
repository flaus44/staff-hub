import type { WidgetServerProps } from 'payload'
import React from 'react'

import {
  COMMAND_GROUPS,
  SECTION_META,
  sectionHref,
} from './admin-command-meta'
import { CmdSectionTile } from './CmdSectionTile'
import { fetchAdminMetrics } from './admin-metrics'

const portalUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default async function AdminCommandHome({ req }: WidgetServerProps) {
  const { user } = req
  const firstName = (user as { firstName?: string } | null)?.firstName?.trim()
  const displayName = firstName || (user as { email?: string } | null)?.email?.split('@')[0] || 'Admin'

  const metrics = await fetchAdminMetrics(req.payload)

  const statusParts: string[] = []
  if (metrics.activeShifts > 0) {
    statusParts.push(`${metrics.activeShifts} clocked in`)
  }
  if (metrics.openIncidents > 0) {
    statusParts.push(`${metrics.openIncidents} open incident${metrics.openIncidents === 1 ? '' : 's'}`)
  }
  if (metrics.pendingSurveys > 0) {
    statusParts.push(`${metrics.pendingSurveys} survey${metrics.pendingSurveys === 1 ? '' : 's'} pending`)
  }
  if (metrics.signingDrafts > 0) {
    statusParts.push(`${metrics.signingDrafts} signing draft${metrics.signingDrafts === 1 ? '' : 's'}`)
  }

  return (
    <div className="cmd-command">
      <div className="cmd-hero">
        <div className="cmd-hero__glow" aria-hidden />
        <div className="cmd-hero__content">
          <div className="cmd-hero__top">
            <div>
              <h1 className="cmd-hero__title">FLAUS Command</h1>
              <p className="cmd-hero__subtitle">Welcome, {displayName}</p>
            </div>
            <a href={`${portalUrl()}/dashboard`} className="cmd-hero__portal">
              Staff portal →
            </a>
          </div>
          {statusParts.length > 0 && <p className="cmd-status">{statusParts.join(' · ')}</p>}
        </div>
      </div>

      <div className="cmd-section-hub">
        <h2 className="cmd-section-title">Sections</h2>
        <div className="cmd-section-grid">
          {COMMAND_GROUPS.map((group) => {
            const meta = SECTION_META[group]

            return (
              <CmdSectionTile
                key={group}
                href={sectionHref(group)}
                title={meta.title}
                description={meta.description}
                icon={meta.icon}
                accent={meta.accent}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
