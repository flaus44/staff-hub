import type { Payload, PayloadRequest } from 'payload'

import { areAutoSubmitOnboardingTasksComplete } from '@/lib/onboarding/task-sections'
import { relIdNumber } from '@/lib/payload-relations'

const SUBMITTED_ASSIGNMENT_STATUSES = new Set([
  'submitted',
  'pending_admin_review',
  'approved',
])

export async function submitOnboardingAssignmentForReview(
  payload: Payload,
  args: {
    assignmentId: string | number
    userId: string | number
    actorId: string | number
    req?: PayloadRequest
  },
): Promise<boolean> {
  const assignment = await payload.findByID({
    collection: 'onboarding-assignments',
    id: args.assignmentId,
    req: args.req,
  })
  if (!assignment) return false

  const assignmentUserId = relIdNumber(
    typeof assignment.user === 'object' ? assignment.user?.id : assignment.user,
  )
  if (!assignmentUserId || String(assignmentUserId) !== String(args.userId)) return false

  const status = String(assignment.status ?? 'in_progress')
  if (SUBMITTED_ASSIGNMENT_STATUSES.has(status)) return false

  const nowIso = new Date().toISOString()
  await payload.update({
    collection: 'onboarding-assignments',
    id: assignment.id,
    data: {
      status: 'submitted',
      submittedAt: nowIso,
    },
    overrideAccess: true,
    req: args.req,
  })
  await payload.update({
    collection: 'staff-users',
    id: String(assignmentUserId),
    data: { onboardingStatus: 'submitted' },
    overrideAccess: true,
    req: args.req,
  })
  await payload.create({
    collection: 'onboarding-events',
    data: {
      user: assignmentUserId,
      assignment: relIdNumber(assignment.id),
      actor: relIdNumber(args.actorId),
      eventType: 'submitted',
    },
    overrideAccess: true,
    req: args.req,
  })

  return true
}

export async function maybeAutoSubmitOnboardingAssignment(
  payload: Payload,
  args: {
    userId: string | number
    assignmentId: string | number | null | undefined
    actorId: string | number
    req?: PayloadRequest
  },
): Promise<void> {
  const assignmentId = relIdNumber(args.assignmentId)
  if (!assignmentId) return

  const tasks = await payload.find({
    collection: 'onboarding-tasks',
    where: {
      and: [
        { user: { equals: String(args.userId) } },
        { assignment: { equals: assignmentId } },
      ],
    },
    limit: 500,
    overrideAccess: true,
    req: args.req,
  })

  if (!areAutoSubmitOnboardingTasksComplete(tasks.docs)) return

  await submitOnboardingAssignmentForReview(payload, {
    assignmentId,
    userId: args.userId,
    actorId: args.actorId,
    req: args.req,
  })
}
