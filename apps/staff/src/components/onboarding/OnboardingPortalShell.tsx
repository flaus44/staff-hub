import React from 'react'

import { PortalShell } from '@/components/PortalShell'
import { onboardingShellProps } from '@/lib/onboarding/hub-meta'
import { fetchOnboardingState } from '@/lib/onboarding/tasks'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

type OnboardingPortalShellProps = {
  title: string
  showHeaderTitle?: boolean
  children: React.ReactNode
}

export async function OnboardingPortalShell({
  title,
  showHeaderTitle = true,
  children,
}: OnboardingPortalShellProps) {
  const user = await getCurrentUser()
  const shellUser = user ? portalShellUser(user as Parameters<typeof portalShellUser>[0]) : {}

  let shellProps = {}
  if (user) {
    const payload = await getPayloadClient()
    const state = await fetchOnboardingState(payload, String(user.id))
    shellProps = onboardingShellProps(state)
  }

  return (
    <PortalShell title={title} showHeaderTitle={showHeaderTitle} {...shellUser} {...shellProps}>
      {children}
    </PortalShell>
  )
}
