import { PortalShell } from '@/components/PortalShell'
import { TrainingHubLayout } from '@/components/TrainingHubLayout'
import { TrainingModuleCard } from '@/components/TrainingModuleCard'
import { EmptyState } from '@flaus/ui-forms/EmptyState'
import { ProgressBar } from '@flaus/ui-forms/ProgressBar'
import {
  MODULE_TYPE_TRAINING,
  type LearningModuleType,
  fetchLearningModulesForUser,
  moduleCardDescription,
} from '@/lib/learning-modules'
import { requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

type LearningModuleListProps = {
  moduleType: LearningModuleType
  shellTitle: string
  emptyTitle: string
  emptyDescription: string
  detailSegment: 'training' | 'policies'
}

export async function LearningModuleList({
  moduleType,
  shellTitle,
  emptyTitle,
  emptyDescription,
  detailSegment,
}: LearningModuleListProps) {
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

  const role = String((user as { role?: string }).role ?? 'staff')
  const { modules, completedIds, staleIds, progressByModuleId } = await fetchLearningModulesForUser(
    payload,
    user.id,
    moduleType,
    role,
  )
  const completedCount = modules.filter((m) => completedIds.has(String(m.id))).length

  const moduleItems = modules.map((mod) => {
    const modId = String(mod.id)
    const progress = progressByModuleId.get(modId)
    return {
      moduleId: modId,
      slug: String(mod.slug),
      title: String(mod.title),
      summary: moduleCardDescription(mod),
      readMinutes: progress?.readMinutes ?? 5,
      done: completedIds.has(modId),
      stale: staleIds.has(modId),
    }
  })

  return (
    <PortalShell title={shellTitle} {...shellUser}>
      {moduleType === MODULE_TYPE_TRAINING ? (
        <TrainingHubLayout
          modules={moduleItems}
          detailSegment={detailSegment}
          moduleType={moduleType}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      ) : (
        <>
          {modules.length > 0 && (
            <div className="mb-6">
              <ProgressBar value={completedCount} max={modules.length} label="Overall progress" />
            </div>
          )}
          <div className="grid gap-4">
            {moduleItems.map((mod) => (
              <TrainingModuleCard
                key={mod.moduleId}
                moduleId={mod.moduleId}
                slug={mod.slug}
                title={mod.title}
                summary={mod.summary}
                readMinutes={mod.readMinutes}
                done={mod.done}
                stale={mod.stale}
                detailSegment={detailSegment}
                moduleType={moduleType}
              />
            ))}
            {modules.length === 0 && (
              <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                icon={
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
              />
            )}
          </div>
        </>
      )}
    </PortalShell>
  )
}
