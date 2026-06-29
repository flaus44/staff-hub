import { notFound } from 'next/navigation'

import { AuthBrandPanel, AuthMobileHeader } from '@/components/AuthBrandPanel'
import { PackJoinForm } from '@/components/onboarding/PackJoinForm'
import { getPayloadClient } from '@/lib/payload'

export default async function PackJoinPage({
  params,
}: {
  params: Promise<{ packSlug: string }>
}) {
  const { packSlug } = await params
  const payload = await getPayloadClient()

  const packs = await payload.find({
    collection: 'onboarding-packs',
    where: {
      and: [{ slug: { equals: packSlug } }, { active: { equals: true } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  const pack = packs.docs[0]
  if (!pack) notFound()

  const packName = String(pack.name)
  const description =
    typeof pack.description === 'string' && pack.description.trim()
      ? pack.description.trim()
      : 'Complete your FLAUS employee onboarding in one place.'

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--cmd-bg)]">
      <AuthBrandPanel title={`Join ${packName}`} subtitle={description} />

      <div className="flex items-center justify-center p-6 md:p-12 bg-[var(--cmd-bg)]">
        <div className="w-full max-w-md">
          <AuthMobileHeader title={`Join ${packName}`} subtitle={description} />
          <PackJoinForm packSlug={packSlug} packName={packName} />
        </div>
      </div>
    </div>
  )
}
