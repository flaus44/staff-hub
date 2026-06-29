import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { ContractSignedActions } from '@/components/ContractSignedActions'
import { PortalShell } from '@/components/PortalShell'
import { PortalCard } from '@flaus/ui-forms/PortalCard'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

const SuccessIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

export default async function ContractCompletedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayloadClient()
  const contract = await payload.findByID({ collection: 'contracts', id, depth: 1 })
  if (!contract) notFound()

  const signatures = await payload.find({
    collection: 'contract-signatures',
    where: {
      and: [{ user: { equals: user.id } }, { contract: { equals: contract.id } }],
    },
    limit: 1,
  })

  if (signatures.docs.length === 0) {
    redirect(`/contracts/${id}/sign`)
  }

  const signature = signatures.docs[0]
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])
  const signedAt = String(signature.signedAt)

  return (
    <PortalShell title="Signed contract" {...shellUser}>
      <div className="max-w-4xl space-y-6">
        <PortalCard
          variant="success"
          icon={<SuccessIcon />}
          eyebrow="Signing complete"
          title={String(contract.title)}
          description="Your signed copy is ready. Download or print the merged PDF below for your records."
        >
          <p className="text-sm text-[var(--cmd-text-muted)]">
            Signed{' '}
            {new Date(signedAt).toLocaleString('en-AU', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </p>
          <Link href="/contracts" className="inline-block mt-3 text-sm font-medium text-primary-700 hover:underline">
            ← Back to all contracts
          </Link>
        </PortalCard>

        <ContractSignedActions
          contractId={String(contract.id)}
          contractTitle={String(contract.title)}
          signedAt={signedAt}
        />
      </div>
    </PortalShell>
  )
}
