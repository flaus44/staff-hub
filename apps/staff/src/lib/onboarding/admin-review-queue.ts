import type { Payload } from 'payload'

import type { OnboardingAssignment, StaffUser } from '@/payload-types'

const REVIEW_QUEUE_STATUSES = ['submitted', 'pending_admin_review'] as const

export type PendingOnboardingReview = {
  assignmentId: string
  staffName: string
  submittedAt?: string
}

function staffNameFromUser(user: OnboardingAssignment['user']): string {
  if (typeof user === 'object' && user) {
    const staff = user as StaffUser
    const name = `${staff.firstName ?? ''} ${staff.lastName ?? ''}`.trim()
    return name || staff.email || 'Unknown'
  }
  return 'Unknown'
}

function mapAssignmentToPendingReview(doc: OnboardingAssignment): PendingOnboardingReview {
  return {
    assignmentId: String(doc.id),
    staffName: staffNameFromUser(doc.user),
    submittedAt: doc.submittedAt ? String(doc.submittedAt) : undefined,
  }
}

export async function fetchPendingOnboardingReviews(
  payload: Payload,
  limit = 5,
): Promise<{ count: number; items: PendingOnboardingReview[]; docs: OnboardingAssignment[] }> {
  const queue = await payload.find({
    collection: 'onboarding-assignments',
    where: {
      status: { in: [...REVIEW_QUEUE_STATUSES] },
    },
    sort: 'submittedAt',
    depth: 1,
    limit,
  })

  return {
    count: queue.totalDocs,
    items: queue.docs.map((doc) => mapAssignmentToPendingReview(doc as OnboardingAssignment)),
    docs: queue.docs as OnboardingAssignment[],
  }
}
