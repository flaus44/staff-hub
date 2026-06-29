import { redirect } from 'next/navigation'

import { AdminReviewQueueClient } from '@/components/onboarding/AdminReviewQueueClient'
import { PortalShell } from '@/components/PortalShell'
import { fetchPendingOnboardingReviews } from '@/lib/onboarding/admin-review-queue'
import { onboardingShellProps } from '@/lib/onboarding/hub-meta'
import { fetchOnboardingState } from '@/lib/onboarding/tasks'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

export default async function OnboardingReviewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const role = String((user as { role?: string }).role ?? 'staff')
  if (role !== 'admin' && role !== 'manager') {
    redirect('/onboarding')
  }

  const payload = await getPayloadClient()
  const state = await fetchOnboardingState(payload, String(user.id))
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])
  const { docs } = await fetchPendingOnboardingReviews(payload, 200)

  return (
    <PortalShell title="Review queue" {...shellUser} {...onboardingShellProps(state)}>
      <AdminReviewQueueClient
        queue={docs as Parameters<typeof AdminReviewQueueClient>[0]['queue']}
      />
    </PortalShell>
  )
}
