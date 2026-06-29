import {
  ONBOARDING_HUB_META,
  ONBOARDING_HUB_FEATURES,
  isOnboardingPath,
  isOnboardingHubActive,
  onboardingFeatureActive,
} from '@/lib/portal-section-meta'

export {
  ONBOARDING_HUB_META,
  ONBOARDING_HUB_FEATURES,
  isOnboardingPath,
  isOnboardingHubActive,
  onboardingFeatureActive,
}

export function onboardingShellProps(state: { completedCount: number; totalCount: number }) {
  return {
    onboardingProgress:
      state.totalCount > 0
        ? { completed: state.completedCount, total: state.totalCount }
        : undefined,
  }
}
