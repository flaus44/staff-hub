import type { WidgetServerProps } from 'payload'
import React from 'react'

import { ADMIN_GROUPS, getCollectionsByGroup } from './admin-collection-meta'
import { AdminIcon, IconChevronRight } from './admin-icons'
import { fetchAdminMetrics, getMetricCount } from './admin-metrics'

function badgeToneForCount(key: string | undefined, count: number): 'success' | 'warning' | 'critical' | 'neutral' | null {
  if (!key || count === 0) return null
  if (key === 'openIncidents') return 'critical'
  if (key === 'activeShifts') return 'success'
  return 'warning'
}

export default async function AdminCollectionsHub({ req }: WidgetServerProps) {
  const metrics = await fetchAdminMetrics(req.payload)

  return (
    <div className="staff-hub-admin-hub">
      {ADMIN_GROUPS.map((group) => {
        const collections = getCollectionsByGroup(group)
        if (collections.length === 0) return null

        return (
          <section key={group} className="staff-hub-admin-hub__group">
            <h3 className="admin-section-header">{group}</h3>
            <div className="admin-hub-grid">
              {collections.map((col) => {
                const count = col.countKey ? getMetricCount(metrics, col.countKey) : undefined
                const badgeTone = badgeToneForCount(col.countKey, count ?? 0)

                return (
                  <a
                    key={col.slug}
                    href={col.href ?? `/admin/collections/${col.slug}`}
                    className="admin-hub-card"
                  >
                    <div className="admin-hub-card__head">
                      <span className="admin-hub-card__icon">
                        <AdminIcon name={col.icon} size="md" />
                      </span>
                      {badgeTone && count !== undefined && count > 0 && (
                        <span className={`admin-badge admin-badge--${badgeTone}`}>{count}</span>
                      )}
                    </div>
                    <h4 className="admin-hub-card__title">{col.title}</h4>
                    <p className="admin-hub-card__description">{col.description}</p>
                    <div className="admin-hub-card__footer">
                      <span className="admin-hub-card__view">View</span>
                      <span className="admin-hub-card__chevron">
                        <IconChevronRight size="sm" />
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
