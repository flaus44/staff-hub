import React from 'react'

import { fetchAdminMetrics } from './admin-metrics'
import AdminNavQuickLinksClient from './AdminNavQuickLinksClient'

export default async function AdminNavQuickLinks() {
  const portalUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  let metrics = {
    openIncidents: 0,
    signingDrafts: 0,
  }

  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })
    const full = await fetchAdminMetrics(payload)
    metrics = {
      openIncidents: full.openIncidents,
      signingDrafts: full.signingDrafts,
    }
  } catch {
    // Nav renders outside full request context in some cases — show links without counts
  }

  const shortcuts = [
    { label: 'Admin dashboard', href: '/admin', icon: 'dashboard' as const },
    {
      label: 'Incidents',
      href: '/admin/collections/incidents',
      icon: 'alert' as const,
      badge: metrics.openIncidents,
      badgeTone: 'critical' as const,
    },
    { label: 'Audit log', href: '/admin/collections/audit-log', icon: 'log' as const },
    {
      label: 'Signing drafts',
      href: '/admin/collections/contract-signing-drafts',
      icon: 'pen' as const,
      badge: metrics.signingDrafts,
      badgeTone: 'warning' as const,
    },
  ]

  return <AdminNavQuickLinksClient portalUrl={portalUrl} shortcuts={shortcuts} />
}
