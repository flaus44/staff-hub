import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PortalShell } from '@/components/PortalShell'
import { Button } from '@flaus/ui-forms/Button'
import { PortalCard } from '@flaus/ui-forms/PortalCard'
import { requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

const SuccessIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

export default async function IncidentSubmittedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayloadClient()
  await requireOnboardingEligibility({ payload, userId: String(user.id), context: 'portal' })
  let incident
  try {
    incident = await payload.findByID({ collection: 'incidents', id, depth: 0 })
  } catch {
    notFound()
  }
  if (!incident) notFound()

  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])

  return (
    <PortalShell title="Report submitted" {...shellUser}>
      <div className="max-w-lg mx-auto">
        <PortalCard
          variant="success"
          icon={<SuccessIcon />}
          title="Incident report submitted"
          description={
            <>
              Your report has been received. Reference number: <strong>#{incident.id}</strong>
            </>
          }
          className="text-center"
        >
          <div className="text-left text-sm text-[var(--cmd-text-muted)] space-y-2 bg-[var(--cmd-surface-raised)] rounded-xl p-4 border border-[var(--cmd-border)]">
            <p className="font-medium text-[var(--cmd-text)]">What happens next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>A manager will review your report</li>
              <li>You may be contacted for additional information</li>
              <li>You can view the status anytime from your incidents list</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
            <Link href={`/incidents/${id}`}>
              <Button className="w-full sm:w-auto">View report</Button>
            </Link>
            <Link href="/incidents">
              <Button variant="outline" className="w-full sm:w-auto">
                Back to incidents
              </Button>
            </Link>
          </div>
        </PortalCard>
      </div>
    </PortalShell>
  )
}
