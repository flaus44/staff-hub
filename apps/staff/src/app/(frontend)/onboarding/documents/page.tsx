import { OnboardingDocumentRow } from '@/components/onboarding/OnboardingDocumentRow'
import { redirect } from 'next/navigation'

import { PortalShell } from '@/components/PortalShell'

import { onboardingShellProps } from '@/lib/onboarding/hub-meta'

import { fetchOnboardingState } from '@/lib/onboarding/tasks'

import { getCurrentUser, getPayloadClient } from '@/lib/payload'

import { portalShellUser } from '@/lib/portal-shell-user'

function documentType(doc: Record<string, unknown>): string {
  return String(doc.documentType ?? '')
}

export default async function OnboardingDocumentsPage() {
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const payload = await getPayloadClient()

  const state = await fetchOnboardingState(payload, String(user.id))

  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])

  const packetDoc = state.documents.find((doc) => documentType(doc) === 'onboarding_packet')

  return (
    <PortalShell title="My documents" {...shellUser} {...onboardingShellProps(state)}>
      <div className="space-y-4">
        {state.documents.length === 0 ? (
          <p className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4 text-sm text-[var(--cmd-text-muted)]">
            Documents appear here after you sign your employment contract.
          </p>
        ) : (
          <>
            {packetDoc ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-[var(--cmd-text)]">
                  Complete signed onboarding packet
                </h2>
                <p className="text-xs text-[var(--cmd-text-muted)]">
                  Your contract, information summary, tax and super forms, and workplace statements in
                  one download.
                </p>
                <OnboardingDocumentRow
                  documentId={String(packetDoc.id)}
                  title={String(packetDoc.title ?? 'Signed onboarding documents')}
                  issuedAt={typeof packetDoc.issuedAt === 'string' ? packetDoc.issuedAt : undefined}
                  prominent
                />
              </section>
            ) : null}
          </>
        )}
      </div>
    </PortalShell>
  )
}
