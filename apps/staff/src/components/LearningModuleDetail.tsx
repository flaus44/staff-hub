import { notFound } from 'next/navigation'
import Link from 'next/link'

import { LearningModuleDetailClient } from '@/components/LearningModuleDetailClient'
import { PortalShell } from '@/components/PortalShell'
import { PortalCard } from '@flaus/ui-forms/PortalCard'
import {
  type LearningModuleType,
  estimateReadMinutes,
  isRetiredTrainingModuleSlug,
  learningModuleListPath,
  learningModuleWhere,
} from '@/lib/learning-modules'
import {
  CO_DESIGN_JOB_AID_SLUGS,
  isCompletionStale,
  jobAidHref,
  parseContentBlocksFromUnknown,
} from '@/lib/training-content-types'
import { requireOnboardingEligibility } from '@/lib/onboarding/eligibility'
import { getCurrentUser, getPayloadClient } from '@/lib/payload'
import { portalShellUser } from '@/lib/portal-shell-user'
import { SESSION_CAPTURE_PRACTICE_SLUG } from '@/lib/session-capture-fields'

type QuizDefinition = {
  questions?: { id: string; prompt: string; options: { id: string; label: string; correct?: boolean }[] }[]
}

type LearningModuleDetailProps = {
  slug: string
  moduleType: LearningModuleType
  eyebrow: string
  completeLabel: string
}

export async function LearningModuleDetail({
  slug,
  moduleType,
  eyebrow: _eyebrow,
  completeLabel,
}: LearningModuleDetailProps) {
  if (isRetiredTrainingModuleSlug(slug)) notFound()

  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayloadClient()
  await requireOnboardingEligibility({
    payload,
    userId: String(user.id),
    context: 'portal',
    allowBeforeApproval: true,
  })
  const modules = await payload.find({
    collection: 'training-modules',
    where: {
      and: [{ slug: { equals: slug } }, learningModuleWhere(moduleType)],
    },
    limit: 1,
  })
  const mod = modules.docs[0]
  if (!mod) notFound()

  const existing = await payload.find({
    collection: 'training-completions',
    where: { and: [{ user: { equals: user.id } }, { module: { equals: mod.id } }] },
    limit: 1,
  })
  const moduleVersion = mod.version ?? 1
  const completion = existing.docs[0]
  const alreadyComplete = Boolean(completion) && !isCompletionStale(moduleVersion, completion?.moduleVersion)
  const blocks = parseContentBlocksFromUnknown(mod.contentBlocks)
  const readMins = estimateReadMinutes({
    content: mod.content,
    contentBlocks: mod.contentBlocks,
    estimatedMinutes: (mod as { estimatedMinutes?: number | null }).estimatedMinutes,
  })
  const shellUser = portalShellUser(user as Parameters<typeof portalShellUser>[0])
  const quiz = (mod.quizDefinition as QuizDefinition | null) ?? {}
  const quizQuestions = (quiz.questions ?? []).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options.map((o) => ({ id: o.id, label: o.label })),
  }))
  const returnPath = learningModuleListPath(moduleType)
  const hasJobAid = CO_DESIGN_JOB_AID_SLUGS.includes(slug as (typeof CO_DESIGN_JOB_AID_SLUGS)[number])
  const summary = mod.summary?.trim() || undefined

  if (slug === 'codesign-practice-capture' && !alreadyComplete) {
    const template = await payload.find({
      collection: 'survey-templates',
      where: { slug: { equals: SESSION_CAPTURE_PRACTICE_SLUG } },
      limit: 1,
      overrideAccess: true,
    })
    const practiceTemplate = template.docs[0]
    let practiceHref = '/surveys'

    if (practiceTemplate) {
      const assignment = await payload.find({
        collection: 'survey-assignments',
        where: {
          and: [
            { assignee: { equals: String(user.id) } },
            { template: { equals: String(practiceTemplate.id) } },
            { status: { not_equals: 'complete' } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })
      if (assignment.docs.length === 0) {
        const created = await payload.create({
          collection: 'survey-assignments',
          data: {
            template: practiceTemplate.id,
            assignee: user.id,
            status: 'pending',
            sessionLabel: 'Practice — Module 16',
          },
          overrideAccess: true,
        })
        practiceHref = `/surveys/${created.id}`
      } else {
        practiceHref = `/surveys/${assignment.docs[0].id}`
      }
    }

    return (
      <PortalShell title={String(mod.title)} {...shellUser}>
        <div className="max-w-2xl space-y-6 pb-24 md:pb-0">
          <PortalCard title={String(mod.title)} description={`About ${readMins} min · practice in the app`}>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-[var(--cmd-text)]">{mod.content}</p>
          </PortalCard>
          <PortalCard title="Practice capture" description="Use fake details only. Same form as live sessions.">
            <Link
              href={practiceHref}
              className="inline-flex w-full min-h-[44px] items-center justify-center rounded-xl bg-[var(--cmd-accent)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 md:w-auto"
            >
              Open practice session capture
            </Link>
          </PortalCard>
        </div>
      </PortalShell>
    )
  }

  return (
    <PortalShell title={String(mod.title)} {...shellUser}>
      {alreadyComplete ? (
        <div className="max-w-2xl">
          <PortalCard variant="success" title="Done — saved" description="You can review this any time.">
            <span className="sr-only">Complete</span>
          </PortalCard>
        </div>
      ) : (
        <LearningModuleDetailClient
          moduleId={mod.id}
          title={String(mod.title)}
          summary={summary}
          content={String(mod.content)}
          contentBlocks={blocks}
          requiresScenarioGate={Boolean(mod.requiresScenarioGate)}
          quizQuestions={quizQuestions}
          completeLabel={completeLabel}
          returnPath={returnPath}
          readMinutes={readMins}
          jobAidHref={hasJobAid ? jobAidHref(slug) : undefined}
        />
      )}
    </PortalShell>
  )
}
