import type { Payload } from 'payload'

import { fetchPendingOnboardingReviews } from '@/lib/onboarding/admin-review-queue'
import {
  MODULE_TYPE_POLICY,
  MODULE_TYPE_TRAINING,
  fetchLearningModulesForUser,
} from '@/lib/learning-modules'
import { byApplicableRoles, employeePortalRole, shouldFallbackRoleFilter } from '@/lib/role-content'
import { formatAuTime } from '@/lib/shift-format'

export interface PortalMetrics {
  clockedIn: boolean
  activeShiftClockIn?: string
  pendingSurveys: number
  unsignedContracts: number
  incompleteTraining: number
  incompletePolicies: number
  openIncidents: number
  pendingOnboardingReviews: number
}

export type PortalMetricCountKey =
  | 'pendingSurveys'
  | 'unsignedContracts'
  | 'incompleteTraining'
  | 'incompletePolicies'
  | 'openIncidents'

export async function fetchPortalMetrics(
  payload: Payload,
  userId: string | number,
  role: string,
): Promise<PortalMetrics> {
  const isManager = role === 'admin' || role === 'manager'
  const roleWhere = byApplicableRoles(employeePortalRole(role))
  const contractsWithRoleFilter = {
    collection: 'contracts' as const,
    where: {
      and: [{ required: { equals: true } }, roleWhere],
    },
    limit: 100,
  }
  const contractsWithoutRoleFilter = {
    collection: 'contracts' as const,
    where: {
      required: { equals: true },
    },
    limit: 100,
  }

  const [activeShift, pendingSurveys, unsignedContracts, trainingData, policyData, openIncidents, pendingReviews] =
    await Promise.all([
      payload.find({
        collection: 'time-entries',
        where: { and: [{ user: { equals: userId } }, { status: { equals: 'active' } }] },
        limit: 1,
      }),
      payload.find({
        collection: 'survey-assignments',
        where: { and: [{ assignee: { equals: userId } }, { status: { not_equals: 'complete' } }] },
        limit: 100,
      }),
      payload.find(contractsWithRoleFilter).catch((error) => {
        if (!shouldFallbackRoleFilter(error, 'applicableRoles')) throw error
        return payload.find(contractsWithoutRoleFilter)
      }),
      fetchLearningModulesForUser(payload, userId, MODULE_TYPE_TRAINING, role),
      fetchLearningModulesForUser(payload, userId, MODULE_TYPE_POLICY, role),
      isManager
        ? payload.find({
            collection: 'incidents',
            where: { status: { not_equals: 'closed' } },
            limit: 100,
          })
        : Promise.resolve({ totalDocs: 0, docs: [] }),
      isManager
        ? fetchPendingOnboardingReviews(payload, 1).then((result) => result.count)
        : Promise.resolve(0),
    ])

  const signatures = await payload.find({
    collection: 'contract-signatures',
    where: { user: { equals: userId } },
    limit: 100,
  })
  const signedIds = new Set(
    signatures.docs.map((s) => String(typeof s.contract === 'object' ? s.contract?.id : s.contract)),
  )
  const unsigned = unsignedContracts.docs.filter((c) => !signedIds.has(String(c.id)))

  const completedModuleIds = trainingData.completedIds
  const incompleteTraining = trainingData.modules.filter((m) => !completedModuleIds.has(String(m.id)))
  const completedPolicyIds = policyData.completedIds
  const incompletePolicies = policyData.modules.filter((m) => !completedPolicyIds.has(String(m.id)))

  const activeShiftDoc = activeShift.docs[0]

  return {
    clockedIn: Boolean(activeShiftDoc),
    activeShiftClockIn: activeShiftDoc ? String(activeShiftDoc.clockIn) : undefined,
    pendingSurveys: pendingSurveys.totalDocs,
    unsignedContracts: unsigned.length,
    incompleteTraining: incompleteTraining.length,
    incompletePolicies: incompletePolicies.length,
    openIncidents: openIncidents.totalDocs,
    pendingOnboardingReviews: pendingReviews,
  }
}

export function getMetricCount(metrics: PortalMetrics, key: PortalMetricCountKey): number {
  return metrics[key]
}

export function buildPortalStatusParts(metrics: PortalMetrics): string[] {
  const parts: string[] = []

  if (metrics.clockedIn && metrics.activeShiftClockIn) {
    parts.push(`Clocked in since ${formatAuTime(metrics.activeShiftClockIn)}`)
  }
  if (metrics.pendingSurveys > 0) {
    parts.push(`${metrics.pendingSurveys} survey${metrics.pendingSurveys === 1 ? '' : 's'} pending`)
  }
  if (metrics.unsignedContracts > 0) {
    parts.push(
      `${metrics.unsignedContracts} contract${metrics.unsignedContracts === 1 ? '' : 's'} unsigned`,
    )
  }
  if (metrics.incompleteTraining > 0) {
    parts.push(
      `${metrics.incompleteTraining} training module${metrics.incompleteTraining === 1 ? '' : 's'} remaining`,
    )
  }
  if (metrics.incompletePolicies > 0) {
    parts.push(
      `${metrics.incompletePolicies} polic${metrics.incompletePolicies === 1 ? 'y' : 'ies'} to acknowledge`,
    )
  }
  if (metrics.openIncidents > 0) {
    parts.push(`${metrics.openIncidents} open incident${metrics.openIncidents === 1 ? '' : 's'}`)
  }
  if (metrics.pendingOnboardingReviews > 0) {
    parts.push(
      `${metrics.pendingOnboardingReviews} onboarding approval${metrics.pendingOnboardingReviews === 1 ? '' : 's'} pending`,
    )
  }

  return parts
}
