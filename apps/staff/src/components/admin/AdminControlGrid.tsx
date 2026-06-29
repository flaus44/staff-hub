import type { WidgetServerProps } from 'payload'
import React from 'react'

import {
  badgeToneForCount,
  COMMAND_GROUPS,
  getCollectionsByGroup,
} from './admin-command-meta'
import { AdminIcon } from './admin-icons'
import { fetchAdminMetrics, getMetricCount } from './admin-metrics'

export default async function AdminControlGrid({ req }: WidgetServerProps) {
  const metrics = await fetchAdminMetrics(req.payload)

  return (
    <div className="cmd-control-section">
      <h2 className="cmd-section-title">Control grid</h2>
      {COMMAND_GROUPS.map((group) => {
        const collections = getCollectionsByGroup(group)
        if (collections.length === 0) return null

        return (
          <section key={group} className="cmd-control-group">
            <h3 className="cmd-control-group__label">{group}</h3>
            <div className="cmd-control-grid">
              {collections.map((col) => {
                const count = col.countKey ? getMetricCount(metrics, col.countKey) : 0
                const badgeTone = badgeToneForCount(col.countKey, count)

                return (
                  <a key={col.slug} href={`/admin/collections/${col.slug}`} className="cmd-control-card">
                    <div className="cmd-control-card__head">
                      <span className="cmd-control-card__icon">
                        <AdminIcon name={col.icon} size="md" />
                      </span>
                      {badgeTone && count > 0 && (
                        <span className={`cmd-badge cmd-badge--${badgeTone}`}>{count}</span>
                      )}
                    </div>
                    <h4 className="cmd-control-card__title">{col.title}</h4>
                    <p className="cmd-control-card__description">{col.description}</p>
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
