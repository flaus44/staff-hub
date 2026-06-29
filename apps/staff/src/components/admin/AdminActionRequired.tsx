import type { WidgetServerProps } from 'payload'
import React from 'react'

import { IconAlert, IconCheckCircle, IconChevronRight, IconClipboard, IconDocument, IconPen } from './admin-icons'
import { fetchAdminMetrics } from './admin-metrics'

interface ActionItem {
  title: string
  subtitle: string
  href: string
  count: number
  tone: 'warning' | 'critical'
  icon: React.ReactNode
}

export default async function AdminActionRequired({ req }: WidgetServerProps) {
  const metrics = await fetchAdminMetrics(req.payload)

  const items: ActionItem[] = []

  if (metrics.openIncidents > 0) {
    items.push({
      title: 'Open incidents',
      subtitle: `${metrics.openIncidents} incident${metrics.openIncidents === 1 ? '' : 's'} need review`,
      href: '/admin/collections/incidents?where[status][not_equals]=closed',
      count: metrics.openIncidents,
      tone: 'critical',
      icon: <IconAlert size="sm" />,
    })
  }

  if (metrics.pendingSurveys > 0) {
    items.push({
      title: 'Pending surveys',
      subtitle: `${metrics.pendingSurveys} assignment${metrics.pendingSurveys === 1 ? '' : 's'} incomplete`,
      href: '/admin/collections/survey-assignments?where[status][not_equals]=complete',
      count: metrics.pendingSurveys,
      tone: 'warning',
      icon: <IconClipboard size="sm" />,
    })
  }

  if (metrics.unsignedEstimate > 0) {
    items.push({
      title: 'Unsigned contracts',
      subtitle: `~${metrics.unsignedEstimate} required signature${metrics.unsignedEstimate === 1 ? '' : 's'} outstanding`,
      href: '/admin/collections/contract-signatures',
      count: metrics.unsignedEstimate,
      tone: 'warning',
      icon: <IconDocument size="sm" />,
    })
  }

  if (metrics.signingDrafts > 0) {
    items.push({
      title: 'Signing drafts',
      subtitle: `${metrics.signingDrafts} draft${metrics.signingDrafts === 1 ? '' : 's'} awaiting verification`,
      href: '/admin/collections/contract-signing-drafts?where[verificationStatus][not_equals]=approved',
      count: metrics.signingDrafts,
      tone: 'warning',
      icon: <IconPen size="sm" />,
    })
  }

  return (
    <div className="staff-hub-admin-actions card">
      <div className="staff-hub-admin-actions__header">
        <h3 className="staff-hub-admin-actions__title">Needs attention</h3>
      </div>
      {items.length === 0 ? (
        <p className="staff-hub-admin-actions__empty">
          <span className="staff-hub-admin-actions__empty-icon">
            <IconCheckCircle size="sm" />
          </span>
          All caught up — nothing needs your review right now.
        </p>
      ) : (
        <div>
          {items.map((item) => (
            <a key={item.title} href={item.href} className="admin-list-row admin-list-row--link">
              <span className={`admin-list-row__icon admin-list-row__icon--${item.tone}`}>{item.icon}</span>
              <span className="admin-list-row__body">
                <p className="admin-list-row__title">{item.title}</p>
                <p className="admin-list-row__subtitle">{item.subtitle}</p>
              </span>
              <span className="admin-list-row__meta">
                <span className={`admin-badge admin-badge--${item.tone}`}>{item.count}</span>
                <span className="admin-list-row__chevron">
                  <IconChevronRight size="sm" />
                </span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
