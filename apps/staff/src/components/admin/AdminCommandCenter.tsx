import type { WidgetServerProps } from 'payload'
import React from 'react'

import { AdminIcon } from './admin-icons'
import { fetchAdminMetrics } from './admin-metrics'

const portalUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const QUICK_ACTIONS = [
  { label: 'Portal', icon: 'home' as const, href: () => `${portalUrl()}/dashboard` },
  { label: 'Staff', icon: 'users' as const, href: () => '/admin/collections/staff-users' },
  {
    label: 'Incidents',
    icon: 'alert' as const,
    href: () => '/admin/collections/incidents?where[status][not_equals]=closed',
  },
  { label: 'Audit', icon: 'log' as const, href: () => '/admin/collections/audit-log' },
]

export default async function AdminCommandCenter({ req }: WidgetServerProps) {
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

  const metricTiles = [
    {
      value: metrics.staffCount,
      label: 'Accounts',
      href: '/admin/collections/staff-users',
      accent: null as 'live' | 'critical' | 'warn' | null,
    },
    {
      value: metrics.activeShifts,
      label: 'Clocked in',
      href: '/admin/collections/time-entries?where[status][equals]=active',
      accent: 'live' as const,
    },
    {
      value: metrics.openIncidents,
      label: 'Open incidents',
      href: '/admin/collections/incidents?where[status][not_equals]=closed',
      accent: 'critical' as const,
    },
    {
      value: metrics.pendingSurveys,
      label: 'Surveys pending',
      href: '/admin/collections/survey-assignments?where[status][not_equals]=complete',
      accent: 'warn' as const,
    },
  ]

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

      <div className="cmd-quick-row">
        {QUICK_ACTIONS.map((action) => (
          <a key={action.label} href={action.href()} className="cmd-quick-action">
            <span className="cmd-quick-action__icon">
              <AdminIcon name={action.icon} size="md" />
            </span>
            <span className="cmd-quick-action__label">{action.label}</span>
          </a>
        ))}
      </div>

      <div className="cmd-metric-grid">
        {metricTiles.map((tile) => {
          const accentClass =
            tile.accent && tile.value > 0 ? `cmd-metric-tile--${tile.accent}` : 'cmd-metric-tile'
          return (
            <a key={tile.label} href={tile.href} className={accentClass}>
              <span className="cmd-metric-tile__value">{tile.value}</span>
              <span className="cmd-metric-tile__label">{tile.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
