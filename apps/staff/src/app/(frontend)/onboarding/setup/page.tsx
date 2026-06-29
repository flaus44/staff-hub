import { OnboardingBlockBanner } from '@/components/onboarding/OnboardingBlockBanner'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { OnboardingStepFocus } from '@/components/onboarding/OnboardingStepFocus'
import { PortalShell } from '@/components/PortalShell'
import { redirect } from 'next/navigation'
import { firstBlockingReason, getOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { onboardingShellProps } from '@/lib/onboarding/hub-meta'
import {
  groupTasksForOnboardingPage,
  ONBOARDING_DISPLAY_SECTION_LABELS,
} from '@/lib/onboarding/task-sections'
import { fetchOnboardingState } from '@/lib/onboarding/tasks'
import { maybeAutoSubmitOnboardingAssignment } from '@/lib/onboarding/submit-for-review'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

export default async function OnboardingSetupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = await searchParams
  const contractLocked = query.contractLocked === '1'
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayloadClient()
  const userId = String(user.id)
  let state = await fetchOnboardingState(payload, userId)

  const assignmentStatus = state.assignment?.status ? String(state.assignment.status) : undefined
  const allTasksComplete = state.totalCount > 0 && state.completedCount >= state.totalCount
  if (allTasksComplete && assignmentStatus === 'in_progress' && state.assignment?.id) {
    await maybeAutoSubmitOnboardingAssignment(payload, {
      userId,
      assignmentId: state.assignment.id as string | number,
      actorId: userId,
    })
    state = await fetchOnboardingState(payload, userId)
  }

  const [eligibility] = await Promise.all([
    getOnboardingEligibility(payload, userId, 'portal'),
  ])

  const block = firstBlockingReason(eligibility)
  const firstName = (user as { firstName?: string }).firstName
  const grouped = groupTasksForOnboardingPage([...state.portalTasks, ...state.trainingTasks])
  const checklistGroups = grouped.map((entry) => ({
    section: entry.section,
    title: ONBOARDING_DISPLAY_SECTION_LABELS[entry.section],
    tasks: entry.tasks,
  }))
  const onboardingStatus =
    state.assignment?.status &&
    ['submitted', 'pending_admin_review', 'approved'].includes(String(state.assignment.status))
      ? String(state.assignment.status)
      : (user as { onboardingStatus?: string }).onboardingStatus

  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])

  return (
    <PortalShell title="Setup" {...shellUser} {...onboardingShellProps(state)}>
      {block && !allTasksComplete ? <OnboardingBlockBanner message={block.message} /> : null}
      {contractLocked ? (
        <OnboardingBlockBanner message="Complete your payroll and pre-work onboarding steps before signing your contract." />
      ) : null}
      <div className="space-y-6 max-w-2xl">
        <OnboardingStepFocus
          firstName={firstName}
          completedCount={state.completedCount}
          totalCount={state.totalCount}
          nextTask={state.nextTask}
          assignmentStatus={
            state.assignment?.status ? String(state.assignment.status) : undefined
          }
          onboardingStatus={onboardingStatus}
        />
        <OnboardingChecklist groups={checklistGroups} nextTask={state.nextTask} />
      </div>
    </PortalShell>
  )
}
