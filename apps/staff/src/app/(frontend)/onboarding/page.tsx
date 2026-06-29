import { PortalSectionHub } from '@/components/PortalSectionHub'
import { PortalSectionTile } from '@/components/PortalSectionTile'
import { PortalShell } from '@/components/PortalShell'
import { redirect } from 'next/navigation'
import { fetchPendingOnboardingReviews } from '@/lib/onboarding/admin-review-queue'
import {
  ONBOARDING_HUB_FEATURES,
  ONBOARDING_HUB_META,
  onboardingShellProps,
} from '@/lib/onboarding/hub-meta'
import { fetchOnboardingState } from '@/lib/onboarding/tasks'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { ONBOARDING_ACCENT } from '@/lib/portal-section-meta'
import { portalShellUser } from '@/lib/portal-shell-user'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayloadClient()
  const userId = String(user.id)
  const role = String((user as { role?: string }).role ?? 'staff')
  const showAdmin = role === 'admin' || role === 'manager'
  const state = await fetchOnboardingState(payload, userId)
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])
  const pendingReviews = showAdmin
    ? await fetchPendingOnboardingReviews(payload, 1)
    : { count: 0, items: [], docs: [] }

  return (
    <PortalShell
      title={ONBOARDING_HUB_META.title}
      showHeaderTitle={false}
      {...shellUser}
      {...onboardingShellProps(state)}
    >
      <PortalSectionHub
        title={ONBOARDING_HUB_META.title}
        description={ONBOARDING_HUB_META.description}
        icon={ONBOARDING_HUB_META.icon}
        accent={ONBOARDING_HUB_META.accent}
        features={ONBOARDING_HUB_FEATURES}
      />

      {showAdmin && pendingReviews.count > 0 ? (
        <section className="cmd-section-hub mt-8">
          <h2 className="cmd-section-title">Admin</h2>
          <div className="cmd-section-grid onboarding-section-grid">
            <PortalSectionTile
              href="/onboarding/review"
              title="Review queue"
              description="Approve or reject completed onboarding submissions"
              icon="clipboard"
              accent={ONBOARDING_ACCENT}
            />
          </div>
        </section>
      ) : null}
    </PortalShell>
  )
}
