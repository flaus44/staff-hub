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

interface AttentionItem {
  label: string
  count: number
  href: string
}

export default async function AdminStaffHubHome({ req }: WidgetServerProps) {
  const { user } = req
  const portalUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const firstName = (user as { firstName?: string } | null)?.firstName?.trim()
  const displayName = firstName || (user as { email?: string } | null)?.email?.split('@')[0] || 'Admin'

  const metrics = await fetchAdminMetrics(req.payload)

  const attention: AttentionItem[] = []

  if (metrics.openIncidents > 0) {
    attention.push({
      label: 'Open incidents',
      count: metrics.openIncidents,
      href: '/admin/collections/incidents?where[status][not_equals]=closed',
    })
  }
  if (metrics.pendingSurveys > 0) {
    attention.push({
      label: 'Pending surveys',
      count: metrics.pendingSurveys,
      href: '/admin/collections/survey-assignments?where[status][not_equals]=complete',
    })
  }
  if (metrics.unsignedEstimate > 0) {
    attention.push({
      label: 'Unsigned contracts',
      count: metrics.unsignedEstimate,
      href: '/admin/collections/contract-signatures',
    })
  }
  if (metrics.signingDrafts > 0) {
    attention.push({
      label: 'Signing drafts',
      count: metrics.signingDrafts,
      href: '/admin/collections/contract-signing-drafts?where[verificationStatus][not_equals]=approved',
    })
  }

  return (
    <div className="staff-hub-admin-home">
      <div className="staff-hub-admin-home__header">
        <h2 className="staff-hub-admin-home__title">Overview</h2>
        <a href={`${portalUrl}/dashboard`} className="staff-hub-admin-home__portal-link">
          Open staff portal →
        </a>
      </div>

      <p className="staff-hub-admin-home__greeting">Welcome back, {displayName}</p>
      <p className="staff-hub-admin-home__date">{formatDate()}</p>

      {attention.length > 0 && (
        <section className="staff-hub-admin-home__attention">
          <h3 className="staff-hub-admin-home__section-label">Needs attention</h3>
          <ul className="staff-hub-admin-home__attention-list">
            {attention.map((item) => (
              <li key={item.label} className="staff-hub-admin-home__attention-item">
                <span className="staff-hub-admin-home__attention-label">
                  {item.label} · {item.count}
                </span>
                <a href={item.href} className="staff-hub-admin-home__attention-action">
                  Review →
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
