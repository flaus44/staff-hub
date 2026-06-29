import { redirect } from 'next/navigation'

import { PortalSectionHub } from '@/components/PortalSectionHub'
import { PortalShell } from '@/components/PortalShell'
import {
  getFeaturesBySection,
  sectionFromSlug,
  SECTION_META,
} from '@/lib/portal-section-meta'
import { getOnboardingEligibility, requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { fetchPortalMetrics } from '@/lib/portal-metrics'
import { portalShellUser } from '@/lib/portal-shell-user'

interface HubPageProps {
  params: Promise<{ section: string }>
}

export default async function HubSectionPage({ params }: HubPageProps) {
  const { section: sectionSlug } = await params

  if (sectionSlug === 'field-work') {
    redirect('/hub/co-design')
  }

  if (sectionSlug === 'onboarding') {
    redirect('/hub/toolbox')
  }

  const sectionId = sectionFromSlug(sectionSlug)

  if (!sectionId) {
    redirect('/dashboard')
  }

  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayloadClient()
  const userId = String(user.id)
  await requireOnboardingEligibility({
    payload,
    userId,
    context: 'portal',
    allowBeforeApproval: true,
  })
  const eligibility = await getOnboardingEligibility(payload, userId, 'portal')
  const role = String((user as { role?: string }).role ?? 'staff')
  const metrics = await fetchPortalMetrics(payload, user.id, role)
  const inOnboarding = !eligibility.canAccessStaffPortal && role !== 'admin'

  if (inOnboarding && sectionId !== 'Toolbox') {
    redirect('/dashboard')
  }

  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])

  const meta = SECTION_META[sectionId]
  let features = getFeaturesBySection(sectionId)
  if (inOnboarding && sectionId === 'Toolbox') {
    features = features.filter(
      (feature) => feature.slug === 'training' || feature.slug === 'policies',
    )
  }
  const lockedFeatureSlugs =
    inOnboarding && sectionId === 'Toolbox' ? ['training', 'policies'] : []

  return (
    <PortalShell title={meta.title} showHeaderTitle={false} sectionFeatures={features} {...shellUser}>
      <PortalSectionHub
        title={meta.title}
        description={meta.description}
        icon={meta.icon}
        accent={meta.accent}
        features={features}
        lockedFeatureSlugs={lockedFeatureSlugs}
        lockedHelperText="Awaiting onboarding confirmation"
        trainingBadgeCount={sectionId === 'Toolbox' ? metrics.incompleteTraining : undefined}
      />
    </PortalShell>
  )
}
