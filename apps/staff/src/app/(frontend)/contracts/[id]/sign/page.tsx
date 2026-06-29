import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { ContractSignClient } from '@/components/ContractSignClient'
import type { SurveyField } from '@/components/DynamicSurveyForm'
import { PortalShell } from '@/components/PortalShell'
import { SkeletonList } from '@flaus/ui-forms/Skeleton'
import { contractRequiresDidit, isDiditConfigured } from '@/lib/contract-didit'
import {
  backfillProfileFromContractForm,
  contractFormDefaults,
  mergeContractFormDefaults,
  resolveContractFormFields,
} from '@/lib/contract-form'
import {
  buildOnboardingSummary,
  getContractConfirmationPrerequisites,
} from '@/lib/onboarding/onboarding-summary'
import { resolveContractDocumentPreviews } from '@/lib/media-files'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

function contractRequiresForm(contract: {
  useDefaultForm?: boolean | null
  formFields?: unknown
}): boolean {
  if (contract.useDefaultForm === false) {
    return Array.isArray(contract.formFields) && contract.formFields.length > 0
  }
  return true
}

export default async function ContractSignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayloadClient()
  const contract = await payload.findByID({ collection: 'contracts', id, depth: 1 })
  if (!contract) notFound()

  const userId = String(user.id)
  const tasksResult = await payload.find({
    collection: 'onboarding-tasks',
    where: { user: { equals: userId } },
    limit: 500,
    depth: 0,
  })
  const tasks = tasksResult.docs as Array<{
    id: string | number
    type: string
    title: string
    status: string
    href?: string | null
    referenceCollection?: string | null
    referenceId?: string | number | null
  }>

  const confirmationGate = getContractConfirmationPrerequisites(tasks, contract.id)
  if (!confirmationGate.canConfirm) {
    redirect('/onboarding/setup?contractLocked=1')
  }

  const staffUserRecord = (await payload.findByID({
    collection: 'staff-users',
    id: userId,
    depth: 0,
    overrideAccess: true,
  })) as unknown as Record<string, unknown>

  const onboardingSummary = buildOnboardingSummary(staffUserRecord, tasks)

  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])
  const documents = resolveContractDocumentPreviews(contract)
  const requiresDetailsForm = contractRequiresForm(contract)
  const requireDiditVerification = contractRequiresDidit(contract)
  const diditConfigured = isDiditConfigured()
  const formFields = requiresDetailsForm
    ? resolveContractFormFields(contract.formFields as SurveyField[] | null | undefined)
    : []
  const staffUser = user as {
    id: string | number
    firstName?: string
    lastName?: string
    email?: string
    startDate?: string | null
    profile?: {
      mobile?: string | null
      suburb?: string | null
      state?: string | null
      postcode?: string | null
    } | null
  }

  const [latestDraft, existingSignature] = await Promise.all([
    payload.find({
      collection: 'contract-signing-drafts',
      where: {
        and: [{ user: { equals: userId } }, { contract: { equals: contract.id } }],
      },
      sort: '-createdAt',
      limit: 1,
    }),
    payload.find({
      collection: 'contract-signatures',
      where: {
        and: [{ user: { equals: userId } }, { contract: { equals: contract.id } }],
      },
      limit: 1,
    }),
  ])

  const savedFormResponses =
    (latestDraft.docs[0]?.formResponses as Record<string, unknown> | undefined) ??
    (existingSignature.docs[0]?.formResponses as Record<string, unknown> | undefined)

  let profile = staffUser.profile
  const profileBackfill = savedFormResponses
    ? backfillProfileFromContractForm(profile, savedFormResponses)
    : null

  if (profileBackfill) {
    await payload.update({
      collection: 'staff-users',
      id: userId,
      data: { profile: profileBackfill },
      overrideAccess: true,
    })
    profile = { ...profile, ...profileBackfill }
  }

  const formDefaults = mergeContractFormDefaults(
    contractFormDefaults({
      firstName: staffUser.firstName,
      lastName: staffUser.lastName,
      email: staffUser.email,
      profile,
    }),
    savedFormResponses,
  )

  if (staffUser.startDate && !formDefaults.startDate) {
    formDefaults.startDate = new Date(String(staffUser.startDate)).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <PortalShell title="Sign contract" {...shellUser}>
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="rounded-2xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-6 min-h-[480px]">
              <SkeletonList rows={5} />
            </div>
            <div className="rounded-2xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-6">
              <SkeletonList rows={3} />
            </div>
          </div>
        }
      >
        <ContractSignClient
          contractId={String(contract.id)}
          title={contract.title}
          bodyText={contract.bodyText ?? ''}
          documents={documents}
          formFields={formFields}
          formDefaults={formDefaults}
          requiresDetailsForm={requiresDetailsForm}
          requireDiditVerification={requireDiditVerification}
          diditConfigured={diditConfigured}
          onboardingSummary={onboardingSummary}
          confirmationGate={confirmationGate}
        />
      </Suspense>
    </PortalShell>
  )
}
