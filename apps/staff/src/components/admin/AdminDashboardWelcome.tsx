import type { WidgetServerProps } from 'payload'
import React from 'react'

import { fetchAdminMetrics } from './admin-metrics'

function formatDate(): string {
  return new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface StatTileProps {
  label: string
  value: number
  href: string
  accent?: 'success' | 'warning' | 'critical' | null
}

function StatTile({ label, value, href, accent }: StatTileProps) {
  const showBadge = accent && value > 0
  const tileClass = accent && value > 0 ? `admin-stat-tile admin-stat-tile--${accent}` : 'admin-stat-tile'

  return (
    <a href={href} className={tileClass}>
      <div className="admin-stat-tile__top">
        <span className="admin-stat-tile__value">{value}</span>
        {showBadge && <span className={`admin-badge admin-badge--${accent}`}>Active</span>}
      </div>
      <span className="admin-stat-tile__label">{label}</span>
    </a>
  )
}

export default async function AdminDashboardWelcome({ req }: WidgetServerProps) {
  const { user } = req
  const portalUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const firstName = (user as { firstName?: string } | null)?.firstName?.trim()
  const displayName = firstName || (user as { email?: string } | null)?.email?.split('@')[0] || 'Admin'

  const metrics = await fetchAdminMetrics(req.payload)

  return (
    <div className="staff-hub-admin-welcome">
      <div className="staff-hub-admin-welcome__hero card">
        <div className="staff-hub-admin-welcome__hero-copy">
          <p className="staff-hub-admin-welcome__eyebrow">{formatDate()}</p>
          <h2 className="staff-hub-admin-welcome__title">Welcome back, {displayName}</h2>
          <p className="staff-hub-admin-welcome__subtitle">
            Your operations hub for staff, contracts, timesheets, training, surveys, and incidents.
          </p>
          <div className="staff-hub-admin-welcome__actions">
            <a className="staff-hub-admin-welcome__btn staff-hub-admin-welcome__btn--primary" href={`${portalUrl}/dashboard`}>
              Open staff portal
            </a>
            <a className="staff-hub-admin-welcome__btn staff-hub-admin-welcome__btn--secondary" href="/admin/collections/staff-users">
              Manage staff
            </a>
          </div>
        </div>
      </div>

      <div className="staff-hub-admin-welcome__stats">
        <StatTile label="Staff accounts" value={metrics.staffCount} href="/admin/collections/staff-users" />
        <StatTile
          label="Clocked in now"
          value={metrics.activeShifts}
          href="/admin/collections/time-entries?where[status][equals]=active"
          accent="success"
        />
        <StatTile
          label="Open incidents"
          value={metrics.openIncidents}
          href="/admin/collections/incidents?where[status][not_equals]=closed"
          accent="critical"
        />
        <StatTile
          label="Surveys pending"
          value={metrics.pendingSurveys}
          href="/admin/collections/survey-assignments?where[status][not_equals]=complete"
          accent="warning"
        />
      </div>
    </div>
  )
}
