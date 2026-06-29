import Link from 'next/link'

import { FacilitatorCheatSheetEmbed } from '@/components/FacilitatorCheatSheetEmbed'
import { IconChevronLeft } from '@/components/portal-icons'
import { PortalShell } from '@/components/PortalShell'
import { PRIVACY_CONTACT_EMAIL } from '@/lib/survey-field'
import { requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

export default async function QuickScriptsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayloadClient()
  await requireOnboardingEligibility({
    payload,
    userId: String(user.id),
    context: 'portal',
    allowBeforeApproval: true,
  })

  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])

  return (
    <PortalShell title="Facilitator cheat sheet" {...shellUser}>
      <div className="max-w-4xl space-y-6 pb-24">
        <Link href="/hub/co-design" className="portal-section-page__back min-h-[44px]">
          <IconChevronLeft size="sm" />
          Back to co-design
        </Link>

        <p className="text-sm leading-relaxed text-[var(--cmd-text-muted)]">
          Print or read on screen — everything you need for a co-design session.
        </p>

        <FacilitatorCheatSheetEmbed />

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--cmd-border)] pt-4 text-sm text-[var(--cmd-text-muted)]">
          <p>
            Privacy questions:{' '}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="text-[var(--cmd-accent)] underline">
              {PRIVACY_CONTACT_EMAIL}
            </a>
          </p>
          <Link href="/training" className="font-medium text-[var(--cmd-accent)] underline">
            Back to training
          </Link>
        </footer>
      </div>
    </PortalShell>
  )
}
