import type { Payload, PayloadRequest } from 'payload'

import { relIdNumber } from '@/lib/payload-relations'

type QueueArgs = {
  payload: Payload
  assignment: Record<string, unknown>
  actorId?: string | number | null
  req?: PayloadRequest
}

// Phase 5 stub: wire this to real Xero API integration.
export async function queueOnboardingXeroSync({ payload, assignment, actorId, req }: QueueArgs) {
  const assignmentId = String(assignment.id)
  const userId =
    typeof assignment.user === 'object' && assignment.user && 'id' in assignment.user
      ? String((assignment.user as { id: string | number }).id)
      : String(assignment.user)

  await payload.update({
    collection: 'onboarding-assignments',
    id: assignmentId,
    data: {
      xeroSyncStatus: 'pending',
      xeroSyncError: null,
      xeroSyncAt: null,
    },
    overrideAccess: true,
    req,
  })

  await payload.create({
    collection: 'onboarding-events',
    data: {
      user: relIdNumber(userId),
      assignment: relIdNumber(assignmentId),
      actor: relIdNumber(actorId),
      eventType: 'xero_sync_queued',
      note: 'Queued onboarding payload for Xero sync (stub).',
    },
    overrideAccess: true,
    req,
  })
}

