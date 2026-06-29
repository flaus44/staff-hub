import { PortalShell } from '@/components/PortalShell'
import { IncidentFormClient } from '@/components/IncidentFormClient'
import { requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

export default async function NewIncidentPage() {
  const user = await getCurrentUser()
  if (!user) return null
  const payload = await getPayloadClient()
  await requireOnboardingEligibility({ payload, userId: String(user.id), context: 'portal' })
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])

  return (
    <PortalShell title="Report an incident" {...shellUser}>
      <IncidentFormClient />
    </PortalShell>
  )
}
