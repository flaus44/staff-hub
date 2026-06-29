import type { Endpoint, PayloadHandler } from 'payload'

import { authenticated } from '@/access/roles'
import { fetchPortalMetrics } from '@/lib/portal-metrics'

export const portalNavMetrics: Endpoint = {
  path: '/portal/metrics',
  method: 'get',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    const role = String((req.user as { role?: string }).role ?? 'staff')
    const metrics = await fetchPortalMetrics(req.payload, req.user!.id, role)

    return Response.json({ incompleteTraining: metrics.incompleteTraining })
  }) as PayloadHandler,
}
