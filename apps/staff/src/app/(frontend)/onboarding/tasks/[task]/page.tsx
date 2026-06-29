import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FwisAcknowledgementTask } from '@/components/onboarding/FwisAcknowledgementTask'
import { RtwTask } from '@/components/onboarding/RtwTask'
import { SuperTask } from '@/components/onboarding/SuperTask'
import { TaskCompleteSuccess } from '@/components/onboarding/TaskCompleteSuccess'
import { TaskCompletionForm, type ProfileDefaults } from '@/components/onboarding/TaskCompletionForm'
import { TaxTask } from '@/components/onboarding/TaxTask'
import { PortalShell } from '@/components/PortalShell'
import { onboardingShellProps } from '@/lib/onboarding/hub-meta'
import { fetchOnboardingState } from '@/lib/onboarding/tasks'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

function modeForType(type: string): 'profile' | 'bank' | 'super' | 'fwis' | 'default' {
  if (type === 'profile') return 'profile'
  if (type === 'bank') return 'bank'
  if (type === 'super') return 'super'
  if (type === 'fwis') return 'fwis'
  if (type === 'rtw') return 'fwis'
  return 'default'
}

export default async function OnboardingTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ task: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { task } = await params
  const query = await searchParams
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayloadClient()
  const userId = String(user.id)
  const state = await fetchOnboardingState(payload, userId)
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])
  const shellProps = onboardingShellProps(state)

  const byId = await payload.find({
    collection: 'onboarding-tasks',
    where: {
      and: [{ user: { equals: userId } }, { id: { equals: task } }],
    },
    limit: 1,
  })

  const byType =
    byId.docs[0] ??
    (
      await payload.find({
        collection: 'onboarding-tasks',
        where: {
          and: [{ user: { equals: userId } }, { type: { equals: task } }],
        },
        limit: 1,
      })
    ).docs[0]

  const onboardingTask = byType

  if (!onboardingTask) {
    return (
      <PortalShell title="Task not found" {...shellUser} {...shellProps}>
        <p className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4 text-sm text-[var(--cmd-text-muted)]">
          Task not found or no longer assigned.{' '}
          <Link href="/onboarding/setup">Return to setup</Link>.
        </p>
      </PortalShell>
    )
  }

  const taskMode = modeForType(String(onboardingTask.type))
  const staffProfile = (user as { profile?: ProfileDefaults }).profile
  const success = query.success === '1'
  const docQuery = query.doc
  const successDocIds = Array.isArray(docQuery)
    ? docQuery.map(String)
    : docQuery
      ? [String(docQuery)]
      : []
  const successDocs =
    successDocIds.length > 0
      ? await payload.find({
          collection: 'onboarding-documents',
          where: {
            and: [
              { user: { equals: userId } },
              { id: { in: successDocIds } },
            ],
          },
          depth: 0,
          limit: successDocIds.length,
        })
      : { docs: [] }
  const successDocumentLinks = successDocIds
    .map((id) =>
      successDocs.docs.find((doc) => String(doc.id) === id) ?? {
        id,
        title: 'official form',
        metadata: {},
      },
    )
    .map((doc) => {
      const formId =
        typeof doc.metadata === 'object' && doc.metadata && 'formId' in doc.metadata
          ? String((doc.metadata as Record<string, unknown>).formId)
          : ''
      const labelByFormId: Record<string, string> = {
        nat3092: 'NAT 3092',
        nat3093: 'NAT 3093',
        nat13080: 'NAT 13080',
      }
      return {
        id: String(doc.id),
        label: labelByFormId[formId] ?? String(doc.title ?? 'official form'),
      }
    })
  const nextTaskHref = state.nextTask
    ? state.nextTask.href || `/onboarding/tasks/${String(state.nextTask.type)}`
    : '/onboarding/setup#onboarding-checklist'

  const taskType = String(onboardingTask.type)
  const isTaxOrSuperSuccess = success && (taskType === 'tax' || taskType === 'super')
  const isFwisSuccess = success && taskType === 'fwis'

  let existingComplianceLetter: { documentId: string; fileName: string } | undefined
  if (taskType === 'super' && !success) {
    const staffUserRecord = await payload.findByID({
      collection: 'staff-users',
      id: userId,
      depth: 2,
      overrideAccess: true,
    })
    const complianceDocument = staffUserRecord.superComplianceLetterDocument
    if (complianceDocument && typeof complianceDocument === 'object') {
      const media = complianceDocument.media
      const metadata =
        complianceDocument.metadata && typeof complianceDocument.metadata === 'object'
          ? (complianceDocument.metadata as Record<string, unknown>)
          : {}
      const fileName =
        (typeof media === 'object' && media?.filename
          ? String(media.filename)
          : String(metadata.originalFileName ?? '')).trim() || 'Uploaded document'
      existingComplianceLetter = {
        documentId: String(complianceDocument.id),
        fileName,
      }
    }
  }

  return (
    <PortalShell title="Onboarding task" {...shellUser} {...shellProps}>
      {taskMode !== 'super' ? (
        <section className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--cmd-text-muted)]">Task</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--cmd-text)]">{String(onboardingTask.title)}</h2>
        </section>
      ) : null}

      <section
        className={
          taskMode === 'super'
            ? 'rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4'
            : 'mt-4 rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4'
        }
      >
        {isTaxOrSuperSuccess ? (
          <TaskCompleteSuccess
            title="Task complete"
            message="Your details have been saved."
            pendingDocumentsNotice="Your selections will be included in your signed onboarding package when you complete your employment contract."
            nextStepHref={nextTaskHref}
          />
        ) : null}
        {isFwisSuccess ? (
          <TaskCompleteSuccess
            title="Task complete"
            message="Your workplace statement acknowledgements have been saved."
            pendingDocumentsNotice="Signed copies will be included in your onboarding package when you sign your employment contract."
            nextStepHref={nextTaskHref}
          />
        ) : null}
        {!success ? (
          <>
            {onboardingTask.type === 'tax' ? <TaxTask taskId={String(onboardingTask.id)} /> : null}
            {onboardingTask.type === 'super' ? (
              <SuperTask
                taskId={String(onboardingTask.id)}
                existingComplianceLetter={existingComplianceLetter}
              />
            ) : null}
            {onboardingTask.type === 'fwis' ? <FwisAcknowledgementTask taskId={String(onboardingTask.id)} /> : null}
            {onboardingTask.type === 'rtw' ? <RtwTask taskId={String(onboardingTask.id)} /> : null}
            {!['tax', 'super', 'fwis', 'rtw'].includes(String(onboardingTask.type)) ? (
              <TaskCompletionForm
                taskId={String(onboardingTask.id)}
                mode={taskMode}
                profileDefaults={taskMode === 'profile' ? staffProfile : undefined}
              />
            ) : null}
          </>
        ) : null}
      </section>
    </PortalShell>
  )
}
