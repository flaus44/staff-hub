import Link from 'next/link'

import { IncidentListClient } from '@/components/IncidentListClient'
import { PortalShell } from '@/components/PortalShell'
import { Button } from '@flaus/ui-forms/Button'
import { EmptyState } from '@flaus/ui-forms/EmptyState'
import { requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

export default async function IncidentsPage() {
  const user = await getCurrentUser()
  if (!user) return null
  const payload = await getPayloadClient()
  await requireOnboardingEligibility({ payload, userId: String(user.id), context: 'portal' })
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])
  const isManager = user.role === 'admin' || user.role === 'manager'

  const where = isManager ? undefined : { reporter: { equals: user.id } }

  const incidents = await payload.find({
    collection: 'incidents',
    where,
    sort: '-occurredAt',
    limit: 50,
  })

  const rows = incidents.docs.map((inc) => ({
    id: String(inc.id),
    category: String(inc.category),
    description: String(inc.description),
    location: String(inc.location),
    occurredAt: String(inc.occurredAt),
    status: String(inc.status),
    severity: String(inc.severity),
  }))

  return (
    <PortalShell title={isManager ? 'Incident review queue' : 'My incidents'} {...shellUser}>
      <div className="mb-6">
        <Link href="/incidents/new">
          <Button>Report an incident</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No incidents recorded"
          description="Report safety incidents, near misses, or property damage when they occur."
          action={
            <Link href="/incidents/new">
              <Button className="px-[10px]">Report an incident</Button>
            </Link>
          }
          icon={
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <IncidentListClient incidents={rows} isManager={isManager} />
      )}
    </PortalShell>
  )
}
