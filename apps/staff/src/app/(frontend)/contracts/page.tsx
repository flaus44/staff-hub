import Link from 'next/link'

import { PortalShell } from '@/components/PortalShell'
import { IconDocument } from '@/components/portal-icons'
import { ActionTile } from '@flaus/ui-forms/ActionTile'
import { Button } from '@flaus/ui-forms/Button'
import { EmptyState } from '@flaus/ui-forms/EmptyState'
import { ListRow } from '@flaus/ui-forms/ListRow'
import { PortalCard } from '@flaus/ui-forms/PortalCard'
import { StatusPill } from '@flaus/ui-forms/StatusPill'
import { requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getContractConfirmationPrerequisites } from '@/lib/onboarding/onboarding-summary'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'
import { byApplicableRoles, employeePortalRole, shouldFallbackRoleFilter } from '@/lib/role-content'

export default async function ContractsPage() {
  const user = await getCurrentUser()
  if (!user) return null
  const payload = await getPayloadClient()
  const userId = String(user.id)
  await requireOnboardingEligibility({
    payload,
    userId,
    context: 'portal',
    allowBeforeApproval: true,
  })
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])
  const role = String((user as { role?: string }).role ?? 'staff')
  const roleWhere = byApplicableRoles(employeePortalRole(role))

  const [contracts, signatures, onboardingAssignments, tasksResult] = await Promise.all([
    payload
      .find({ collection: 'contracts', where: roleWhere, limit: 50 })
      .catch((error) => {
        if (!shouldFallbackRoleFilter(error, 'applicableRoles')) throw error
        return payload.find({ collection: 'contracts', limit: 50 })
      }),
    payload.find({ collection: 'contract-signatures', where: { user: { equals: user.id } }, limit: 100 }),
    payload.find({
      collection: 'onboarding-assignments',
      where: { user: { equals: userId } },
      sort: '-updatedAt',
      limit: 1,
    }),
    payload.find({
      collection: 'onboarding-tasks',
      where: { user: { equals: userId } },
      limit: 500,
      depth: 0,
    }),
  ])

  const tasks = tasksResult.docs as Array<{
    id: string | number
    type: string
    title: string
    status: string
    href?: string | null
    referenceCollection?: string | null
    referenceId?: string | number | null
  }>

  const assignment = onboardingAssignments.docs[0]
  const assignedContractIds = new Set(
    Array.isArray(assignment?.assignedContracts)
      ? assignment.assignedContracts.map((value) =>
          String(typeof value === 'object' && value ? value.id : value),
        )
      : [],
  )

  const visibleContracts = assignment
    ? contracts.docs.filter((contract) => assignedContractIds.has(String(contract.id)))
    : contracts.docs

  const signed = new Set(signatures.docs.map((s) => String(typeof s.contract === 'object' ? s.contract?.id : s.contract)))
  const unsigned = visibleContracts.filter((c) => !signed.has(String(c.id)))

  return (
    <PortalShell title="Contracts" {...shellUser}>
      {unsigned.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--cmd-text-muted)] mb-3">Action required</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {unsigned.map((c) => {
              const gate = getContractConfirmationPrerequisites(tasks, c.id)
              return (
                <ActionTile
                  key={c.id}
                  eyebrow="Contract"
                  icon={<IconDocument />}
                  title={String(c.title)}
                  description={
                    gate.canConfirm
                      ? 'Confirm your details, verify identity, and sign'
                      : 'Complete your onboarding checklist before signing'
                  }
                  action={
                    gate.canConfirm ? (
                      <Link href={`/contracts/${c.id}/sign`}>
                        <Button variant="dark" className="rounded-xl text-sm">
                          Sign
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/onboarding/setup">
                        <Button variant="outline" className="rounded-xl text-sm">
                          Complete onboarding
                        </Button>
                      </Link>
                    )
                  }
                />
              )
            })}
          </div>
        </section>
      )}

      <PortalCard title="All agreements">
        {visibleContracts.length === 0 ? (
          <EmptyState
            title="No contracts assigned"
            description="When your organisation assigns agreements, they will appear here."
            action={
              <Link href="/dashboard" className="text-sm font-medium text-primary-700 hover:underline">
                Back to home
              </Link>
            }
          />
        ) : (
          <div>
            {visibleContracts.map((c) => {
              const isSigned = signed.has(String(c.id))
              const gate = getContractConfirmationPrerequisites(tasks, c.id)
              const signHref = gate.canConfirm ? `/contracts/${c.id}/sign` : '/onboarding/setup?contractLocked=1'
              return (
                <ListRow
                  key={c.id}
                  icon={<IconDocument />}
                  primary={String(c.title)}
                  secondary={
                    c.required && !isSigned
                      ? gate.canConfirm
                        ? 'Required before you can work'
                        : 'Complete onboarding before signing'
                      : undefined
                  }
                  trailing={
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      <StatusPill status={isSigned ? 'Signed' : 'Unsigned'} variant={isSigned ? 'success' : 'danger'} />
                      <Link
                        href={isSigned ? `/contracts/${c.id}/completed` : signHref}
                        className="text-sm text-primary-700 font-medium hover:underline whitespace-nowrap"
                      >
                        {isSigned ? 'View & print →' : gate.canConfirm ? 'Review & sign →' : 'Finish onboarding →'}
                      </Link>
                    </div>
                  }
                  showChevron
                />
              )
            })}
          </div>
        )}
      </PortalCard>
    </PortalShell>
  )
}
