import { PortalShell } from '@/components/PortalShell'
import { TimesheetClient } from '@/components/TimesheetClient'
import { requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getCurrentUser } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'
import { getPayloadClient } from '@/lib/payload'

export default async function TimesheetsPage() {
  const user = await getCurrentUser()
  if (!user) return null
  const payload = await getPayloadClient()
  await requireOnboardingEligibility({ payload, userId: String(user.id), context: 'portal' })
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])

  return (
    <PortalShell title="Timesheets" {...shellUser}>
      <TimesheetClient />
    </PortalShell>
  )
}
