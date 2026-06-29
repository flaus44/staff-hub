import type { Payload } from 'payload'

export interface AdminMetrics {
  staffCount: number
  activeShifts: number
  pendingSurveys: number
  requiredContracts: number
  totalSignatures: number
  signingDrafts: number
  openIncidents: number
  unsignedEstimate: number
}

export type MetricCountKey =
  | 'openIncidents'
  | 'pendingSurveys'
  | 'activeShifts'
  | 'signingDrafts'
  | 'unsignedEstimate'

export async function fetchAdminMetrics(payload: Payload): Promise<AdminMetrics> {
  const [staffCount, activeShifts, pendingSurveys, requiredContracts, totalSignatures, signingDrafts, openIncidents] =
    await Promise.all([
      payload.count({ collection: 'staff-users' }),
      payload.count({ collection: 'time-entries', where: { status: { equals: 'active' } } }),
      payload.count({ collection: 'survey-assignments', where: { status: { not_equals: 'complete' } } }),
      payload.count({ collection: 'contracts', where: { required: { equals: true } } }),
      payload.count({ collection: 'contract-signatures' }),
      payload.count({
        collection: 'contract-signing-drafts',
        where: { verificationStatus: { not_equals: 'approved' } },
      }),
      payload.count({ collection: 'incidents', where: { status: { not_equals: 'closed' } } }),
    ])

  const unsignedEstimate = Math.max(0, requiredContracts.totalDocs - totalSignatures.totalDocs)

  return {
    staffCount: staffCount.totalDocs,
    activeShifts: activeShifts.totalDocs,
    pendingSurveys: pendingSurveys.totalDocs,
    requiredContracts: requiredContracts.totalDocs,
    totalSignatures: totalSignatures.totalDocs,
    signingDrafts: signingDrafts.totalDocs,
    openIncidents: openIncidents.totalDocs,
    unsignedEstimate,
  }
}

export function getMetricCount(metrics: AdminMetrics, key: MetricCountKey): number {
  return metrics[key]
}
