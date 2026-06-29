import { notFound } from 'next/navigation'

import { IncidentDetailClient } from '@/components/IncidentDetailClient'
import { PortalShell } from '@/components/PortalShell'
import { requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayloadClient()
  await requireOnboardingEligibility({ payload, userId: String(user.id), context: 'portal' })
  let incident
  try {
    incident = await payload.findByID({ collection: 'incidents', id, depth: 1 })
  } catch {
    notFound()
  }
  if (!incident) notFound()

  const isManager = user.role === 'admin' || user.role === 'manager'
  const reporterId =
    typeof incident.reporter === 'object' ? incident.reporter?.id : incident.reporter
  if (!isManager && String(reporterId) !== String(user.id)) {
    notFound()
  }

  const reporter =
    typeof incident.reporter === 'object' && incident.reporter
      ? `${(incident.reporter as { firstName?: string }).firstName ?? ''} ${(incident.reporter as { lastName?: string }).lastName ?? ''}`.trim()
      : undefined

  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])

  return (
    <PortalShell title="Incident details" {...shellUser}>
      <IncidentDetailClient
        isManager={isManager}
        incident={{
          id: String(incident.id),
          category: String(incident.category),
          description: String(incident.description),
          location: String(incident.location),
          occurredAt: String(incident.occurredAt),
          status: String(incident.status),
          severity: String(incident.severity),
          immediateActions: incident.immediateActions ? String(incident.immediateActions) : undefined,
          treatmentRequired: Boolean(incident.treatmentRequired),
          witnesses: Array.isArray(incident.witnesses)
            ? (incident.witnesses as { name?: string; contact?: string; role?: string }[])
            : [],
          reporterName: reporter || undefined,
        }}
      />
    </PortalShell>
  )
}
