import Link from 'next/link'

import { PortalShell } from '@/components/PortalShell'
import { IconClipboard } from '@/components/portal-icons'
import { Button } from '@flaus/ui-forms/Button'
import { EmptyState } from '@flaus/ui-forms/EmptyState'
import { ListRow } from '@flaus/ui-forms/ListRow'
import { PortalCard } from '@flaus/ui-forms/PortalCard'
import { ProgressBar } from '@flaus/ui-forms/ProgressBar'
import { StatusPill } from '@flaus/ui-forms/StatusPill'
import { requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'

function surveyProgress(status: string, fieldCount: number): number {
  if (status === 'complete') return 100
  if (status === 'in_progress' && fieldCount > 0) return Math.round(fieldCount * 0.5)
  return 0
}

export default async function SurveysPage() {
  const user = await getCurrentUser()
  if (!user) return null
  const payload = await getPayloadClient()

  const assignments = await payload.find({
    collection: 'survey-assignments',
    where: { assignee: { equals: user.id } },
    depth: 1,
    limit: 50,
  })

  const hasPendingLiveCapture = assignments.docs.some((a) => {
    if (a.status === 'complete') return false
    const template = typeof a.template === 'object' ? a.template : null
    return template?.formKind === 'session_capture' && template?.captureMode === 'live'
  })

  await requireOnboardingEligibility({
    payload,
    userId: String(user.id),
    context: 'portal',
    allowBeforeApproval: !hasPendingLiveCapture,
  })
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])

  return (
    <PortalShell title="Session capture" {...shellUser}>
      <div className="grid gap-4 max-w-2xl">
        {assignments.docs.map((a) => {
          const template = typeof a.template === 'object' ? a.template : null
          const fields = Array.isArray(template?.fields) ? template.fields : []
          const progress = surveyProgress(String(a.status), fields.length)
          const isComplete = a.status === 'complete'

          return (
            <PortalCard key={a.id} padding="sm">
              <ListRow
                icon={<IconClipboard />}
                primary={template?.title ?? 'Survey'}
                secondary={
                  a.dueDate
                    ? `Due ${new Date(String(a.dueDate)).toLocaleDateString('en-AU')}`
                    : 'No due date'
                }
                meta={<ProgressBar value={progress} max={100} label="Progress" showPercent />}
                trailing={
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill status={String(a.status)} variant={isComplete ? 'success' : 'warning'} />
                    {!isComplete ? (
                      <Link href={`/surveys/${a.id}`}>
                        <Button className="rounded-xl text-sm">Continue</Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-[var(--cmd-text-muted)]">Completed</span>
                    )}
                  </div>
                }
              />
            </PortalCard>
          )
        })}
        {assignments.docs.length === 0 && (
          <EmptyState
            title="No session captures assigned"
            description="Complete co-design training and practice capture to unlock live session capture."
            icon={
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            }
          />
        )}
      </div>
    </PortalShell>
  )
}
