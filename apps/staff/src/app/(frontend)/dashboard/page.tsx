import { DashboardClockBanner } from '@/components/DashboardClockBanner'
import { OnboardingReviewBanner } from '@/components/onboarding/OnboardingReviewBanner'
import { PortalHero } from '@/components/PortalHero'
import { PortalSectionTile } from '@/components/PortalSectionTile'
import { PortalShell } from '@/components/PortalShell'
import { fetchPortalMetrics, buildPortalStatusParts } from '@/lib/portal-metrics'
import { fetchPendingOnboardingReviews } from '@/lib/onboarding/admin-review-queue'
import { getOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { ONBOARDING_ACCENT } from '@/lib/portal-section-meta'
import {
  getFeaturesBySection,
  PORTAL_SECTIONS,
  sectionHref,
  SECTION_META,
} from '@/lib/portal-section-meta'
import { fetchOnboardingState } from '@/lib/onboarding/tasks'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayloadClient()
  const userId = String(user.id)
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])
  const firstName = (user as { firstName?: string }).firstName?.trim()
  const role = String((user as { role?: string }).role ?? 'staff')
  const showAdmin = role === 'admin' || role === 'manager'

  const [eligibility, metrics, onboardingState, pendingReviews] = await Promise.all([
    getOnboardingEligibility(payload, userId, 'portal'),
    fetchPortalMetrics(payload, user.id, role),
    fetchOnboardingState(payload, userId),
    showAdmin ? fetchPendingOnboardingReviews(payload, 3) : Promise.resolve({ count: 0, items: [], docs: [] }),
  ])

  const inOnboarding = !eligibility.canAccessStaffPortal && role !== 'admin'
  const onboardingRemaining = onboardingState.totalCount - onboardingState.completedCount

  const toolboxFeatures = inOnboarding
    ? getFeaturesBySection('Toolbox').filter(
        (feature) => feature.slug === 'training' || feature.slug === 'policies',
      )
    : getFeaturesBySection('Toolbox')

  return (
    <PortalShell title="Home" {...shellUser}>
      <PortalHero
        eyebrow={formatDate()}
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        statusParts={
          inOnboarding
            ? [
                onboardingRemaining > 0
                  ? `${onboardingRemaining} onboarding step${onboardingRemaining === 1 ? '' : 's'} remaining`
                  : 'Onboarding paperwork complete',
                onboardingState.trainingIncompleteCount > 0
                  ? `${onboardingState.trainingIncompleteCount} training item${onboardingState.trainingIncompleteCount === 1 ? '' : 's'} in Toolbox`
                  : 'Training up to date',
              ]
            : buildPortalStatusParts(metrics)
        }
        adminHref={showAdmin ? '/admin' : undefined}
      />

      {showAdmin && !inOnboarding ? (
        <OnboardingReviewBanner count={pendingReviews.count} items={pendingReviews.items} />
      ) : null}

      {!inOnboarding ? <DashboardClockBanner clockedIn={metrics.clockedIn} clockInTime={metrics.activeShiftClockIn} /> : null}

      {inOnboarding ? (
        <>
          <section className="cmd-section-hub">
            <h2 className="cmd-section-title">Onboarding</h2>
            <div className="cmd-section-grid onboarding-section-grid">
              <PortalSectionTile
                href="/onboarding/setup"
                title="Your paperwork"
                description="Contracts, payroll details, and work rights"
                icon="clipboard"
                accent={ONBOARDING_ACCENT}
              />
            </div>
          </section>

          <section className="cmd-section-hub">
            <h2 className="cmd-section-title">{SECTION_META.Toolbox.title}</h2>
            <div className="cmd-section-grid onboarding-section-grid">
              {toolboxFeatures.map((feature) => {
                const isLocked = feature.slug === 'training' || feature.slug === 'policies'

                return (
                  <PortalSectionTile
                    key={feature.slug}
                    href={feature.href}
                    title={feature.title}
                    description={feature.description}
                    icon={feature.icon}
                    accent={SECTION_META.Toolbox.accent}
                    locked={isLocked}
                    helperText={isLocked ? 'Awaiting onboarding confirmation' : undefined}
                  />
                )
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="cmd-section-hub">
          <h2 className="cmd-section-title">Sections</h2>
          <div className="cmd-section-grid">
            {PORTAL_SECTIONS.map((sectionId) => {
              const meta = SECTION_META[sectionId]

              return (
                <PortalSectionTile
                  key={sectionId}
                  href={sectionHref(sectionId)}
                  title={meta.title}
                  description={meta.description}
                  icon={meta.icon}
                  accent={meta.accent}
                />
              )
            })}
          </div>
        </section>
      )}
    </PortalShell>
  )
}
