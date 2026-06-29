import { notFound, redirect } from 'next/navigation'

import { SessionCaptureFormClient } from '@/components/SessionCaptureFormClient'
import { PortalShell } from '@/components/PortalShell'
import { requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'
import type { SurveyField } from '@/lib/survey-field'

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayloadClient()
  const assignment = await payload.findByID({ collection: 'survey-assignments', id, depth: 2 })
  if (!assignment || String(assignment.assignee) !== String(user.id)) notFound()
  if (assignment.status === 'complete') redirect('/surveys')

  const template = typeof assignment.template === 'object' ? assignment.template : null
  if (!template) notFound()

  const isPractice = template.captureMode === 'practice'
  await requireOnboardingEligibility({
    payload,
    userId: String(user.id),
    context: 'portal',
    allowBeforeApproval: isPractice,
  })

  const isSessionCapture = template.formKind === 'session_capture'

  const draft = await payload.find({
    collection: 'survey-response-drafts',
    where: {
      and: [
        { assignment: { equals: id } },
        { respondent: { equals: String(user.id) } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  const draftDoc = draft.docs[0]
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])

  const title = isSessionCapture
    ? isPractice
      ? 'Practice session capture'
      : 'Session capture'
    : (template.title ?? 'Survey')

  const fields = (template.fields as SurveyField[]) ?? []

  return (
    <PortalShell title={title} {...shellUser}>
      <SessionCaptureFormClient
        assignmentId={id}
        fields={fields}
        piiWarning={Boolean(template.piiWarning)}
        isSessionCapture={isSessionCapture}
        bannerText={
          isPractice
            ? 'Practice session — not saved as live project data. Use fake details only.'
            : isSessionCapture
              ? 'Complete after your co-design session. Privacy questions: mentors@flaus.com.au'
              : undefined
        }
        submitLabel={isSessionCapture ? 'Save session' : 'Submit survey'}
        initialAnswers={(draftDoc?.answers as Record<string, unknown>) ?? undefined}
        initialStep={draftDoc?.currentStep ?? 0}
      />
    </PortalShell>
  )
}
