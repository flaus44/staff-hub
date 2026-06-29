import { redirect } from 'next/navigation'



import { InviteEmployeeForm } from '@/components/onboarding/InviteEmployeeForm'

import { PackJoinLinks } from '@/components/onboarding/PackJoinLinks'

import { PortalShell } from '@/components/PortalShell'

import { onboardingShellProps } from '@/lib/onboarding/hub-meta'

import { packJoinUrl } from '@/lib/onboarding/join-links'

import { fetchOnboardingState } from '@/lib/onboarding/tasks'

import { getCurrentUser, getPayloadClient } from '@/lib/payload'

import { portalShellUser } from '@/lib/portal-shell-user'



export default async function OnboardingInvitePage() {

  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const role = String((user as { role?: string }).role ?? 'staff')

  if (role !== 'admin' && role !== 'manager') {

    redirect('/onboarding')

  }



  const payload = await getPayloadClient()

  const state = await fetchOnboardingState(payload, String(user.id))

  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])

  const packs = await payload.find({

    collection: 'onboarding-packs',

    where: { active: { equals: true } },

    sort: 'name',

    limit: 200,

  })



  return (

    <PortalShell title="Invite employee" {...shellUser} {...onboardingShellProps(state)}>

      <div className="space-y-4">

        <PackJoinLinks

          packs={packs.docs.map((pack) => ({

            name: String(pack.name),

            slug: String(pack.slug),

            joinUrl: packJoinUrl(String(pack.slug)),

          }))}

        />

        <InviteEmployeeForm

          packs={packs.docs.map((pack) => ({ id: String(pack.id), name: String(pack.name) }))}

        />

      </div>

    </PortalShell>

  )

}

