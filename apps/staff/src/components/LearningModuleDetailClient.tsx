'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { TrainingMarkdown } from '@/components/TrainingMarkdown'
import { TrainingModuleHero } from '@/components/TrainingModuleHero'
import { TrainingPlayer } from '@/components/TrainingPlayer'
import { TrainingStepSidebar } from '@/components/TrainingStepSidebar'
import { TrainingStickyNav } from '@/components/TrainingStickyNav'
import { PortalCard } from '@flaus/ui-forms/PortalCard'
import { Checkbox } from '@flaus/ui-forms/Checkbox'
import {
  collectBlockQuizQuestions,
  type TrainingContentBlock,
  trainingStepStorageKey,
} from '@/lib/training-content-types'
import {
  getWatchedVideoCount,
  meetsPsychosocialVideoGate,
  PSYCHOSOCIAL_VIDEO_GATE_THRESHOLD,
  psychosocialVideoGateMessage,
  WHS_HUB_VIDEO_COUNT,
} from '@/lib/training-video-progress'

const PSYCHOSOCIAL_INTRO_STEP_ID = 'psychosocial-intro'

type QuizOption = { id: string; label: string }
type QuizQuestion = { id: string; prompt: string; options: QuizOption[] }

type LearningModuleDetailClientProps = {
  moduleId: string | number
  title: string
  summary?: string
  content: string
  contentBlocks: TrainingContentBlock[]
  requiresScenarioGate: boolean
  quizQuestions: QuizQuestion[]
  completeLabel: string
  returnPath: string
  readMinutes: number
  jobAidHref?: string
}

export function LearningModuleDetailClient({
  moduleId,
  title,
  summary,
  content,
  contentBlocks,
  requiresScenarioGate,
  quizQuestions,
  completeLabel,
  returnPath,
  readMinutes,
  jobAidHref,
}: LearningModuleDetailClientProps) {
  const steps = contentBlocks && contentBlocks.length > 0 ? contentBlocks : null
  const totalSteps = steps?.length ?? 1

  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<string>>>({})
  const [blockAttestations, setBlockAttestations] = useState<Record<string, boolean>>({})
  const [finalAttestation, setFinalAttestation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [watchedVideoCount, setWatchedVideoCount] = useState(0)
  const [stepAnnouncement, setStepAnnouncement] = useState('')
  const moduleOpenedAtRef = useRef(Date.now())

  const storageKey = trainingStepStorageKey(moduleId)

  useEffect(() => {
    const refresh = () => setWatchedVideoCount(getWatchedVideoCount())
    refresh()
    window.addEventListener('flaus-training-video-progress', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('flaus-training-video-progress', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    if (!steps) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const idx = parseInt(saved, 10)
        if (!Number.isNaN(idx) && idx >= 0 && idx < totalSteps) setStepIndex(idx)
      }
    } catch {
      /* ignore */
    }
  }, [storageKey, totalSteps, steps])

  const persistStep = useCallback(
    (idx: number) => {
      try {
        localStorage.setItem(storageKey, String(idx))
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  )

  const allQuizQuestions = useMemo(() => {
    const blockQuizzes = steps ? collectBlockQuizQuestions(steps) : []
    const merged = [...quizQuestions]
    for (const q of blockQuizzes) {
      if (!merged.some((m) => m.id === q.id)) merged.push(q)
    }
    return merged
  }, [quizQuestions, steps])

  const currentBlock = steps?.[stepIndex]

  useEffect(() => {
    if (!currentBlock) return
    const label = currentBlock.title?.trim() || `Step ${stepIndex + 1}`
    setStepAnnouncement(`Now on ${label}, step ${stepIndex + 1} of ${totalSteps}`)
  }, [stepIndex, currentBlock, totalSteps])

  function blockComplete(block: TrainingContentBlock): boolean {
    if (block.type === 'quiz' && block.quiz) return Boolean(answers[block.quiz.id])
    if (block.type === 'attestation') return Boolean(blockAttestations[block.id])
    if (block.type === 'checklist' && block.checklist?.length) {
      return (checkedItems[block.id]?.size ?? 0) >= 1
    }
    return true
  }

  const isPsychosocialStep = currentBlock?.id === PSYCHOSOCIAL_INTRO_STEP_ID
  const videoGateMet = meetsPsychosocialVideoGate()
  const psychosocialBlocked = isPsychosocialStep && !videoGateMet

  const canAdvance = (!currentBlock || blockComplete(currentBlock)) && !psychosocialBlocked
  const isLastStep = steps ? stepIndex >= totalSteps - 1 : true

  const attestationLabel = requiresScenarioGate
    ? 'I understand this and will follow it in my sessions'
    : 'I have read this module and will follow it in my work for Financial Literacy Australia'

  function toggleChecklistItem(blockId: string, itemId: string) {
    setCheckedItems((prev) => {
      const set = new Set(prev[blockId] ?? [])
      if (set.has(itemId)) set.delete(itemId)
      else set.add(itemId)
      return { ...prev, [blockId]: set }
    })
  }

  function goToStep(index: number) {
    setStepIndex(index)
    persistStep(index)
    setError(null)
  }

  async function handleComplete() {
    setError(null)

    if (!finalAttestation) {
      setError('Please confirm you understand and will follow this module.')
      return
    }

    for (const q of allQuizQuestions) {
      if (!answers[q.id]) {
        setError('Please answer all check questions before finishing.')
        return
      }
    }

    setSubmitting(true)
    try {
      const responses = allQuizQuestions.map((q) => ({
        questionId: q.id,
        answerId: answers[q.id] ?? '',
      }))

      const dwellMs = Math.max(0, Date.now() - moduleOpenedAtRef.current)

      const res = await fetch('/api/portal/training/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          responses,
          attestationAccepted: true,
          dwellMs,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          data.error === 'quiz_failed'
            ? 'Not quite — read the section again and try once more.'
            : data.error === 'attestation_required'
              ? 'Please confirm you understand and will follow this module.'
              : 'Could not save completion. Please try again.',
        )
        return
      }

      try {
        localStorage.removeItem(storageKey)
      } catch {
        /* ignore */
      }

      setDone(true)
      window.location.href = returnPath
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <PortalCard variant="success" title="Done — saved" description="Your progress has been recorded.">
        <span className="sr-only">Complete</span>
      </PortalCard>
    )
  }

  if (steps && currentBlock) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 pb-28 md:pb-6">
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {stepAnnouncement}
        </div>

        <TrainingModuleHero
          title={title}
          summary={summary}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          steps={steps}
          jobAidHref={jobAidHref}
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <TrainingStepSidebar
            steps={steps}
            stepIndex={stepIndex}
            onStepSelect={goToStep}
          />
          <div className="min-w-0 flex-1 space-y-4">
            <TrainingPlayer
              block={currentBlock}
              stepIndex={stepIndex}
              answers={answers}
              checkedItems={checkedItems}
              blockAttestations={blockAttestations}
              onAnswer={(questionId, answerId) =>
                setAnswers((prev) => ({ ...prev, [questionId]: answerId }))
              }
              onToggleChecklistItem={toggleChecklistItem}
              onBlockAttestation={(blockId, checked) =>
                setBlockAttestations((prev) => ({ ...prev, [blockId]: checked }))
              }
            />

            {psychosocialBlocked ? (
              <div
                role="status"
                className="rounded-xl border border-[var(--cmd-border)] bg-[rgba(62,106,225,0.06)] p-4"
              >
                <p className="text-sm leading-relaxed text-[var(--cmd-text)]">
                  {psychosocialVideoGateMessage(watchedVideoCount)}
                </p>
                <Link
                  href="/training"
                  className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--cmd-accent)] underline"
                >
                  Open WorkSafe videos on Training ({watchedVideoCount}/{WHS_HUB_VIDEO_COUNT} watched
                  {watchedVideoCount < PSYCHOSOCIAL_VIDEO_GATE_THRESHOLD
                    ? ` · ${PSYCHOSOCIAL_VIDEO_GATE_THRESHOLD - watchedVideoCount} more needed`
                    : ''}
                  )
                </Link>
              </div>
            ) : null}

            {isLastStep ? (
              <div className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4 md:hidden">
                <p className="mb-2 text-sm font-medium text-[var(--cmd-text)]">Confirm before finishing</p>
                <Checkbox
                  id="final-attestation-mobile"
                  label={attestationLabel}
                  checked={finalAttestation}
                  onChange={(e) => setFinalAttestation(e.target.checked)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <TrainingStickyNav
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          isLastStep={isLastStep}
          canAdvance={canAdvance}
          submitting={submitting}
          completeLabel={completeLabel}
          requiresScenarioGate={requiresScenarioGate}
          finalAttestation={finalAttestation}
          onFinalAttestationChange={setFinalAttestation}
          onBack={() => goToStep(stepIndex - 1)}
          onContinue={() => {
            if (!canAdvance) return
            goToStep(stepIndex + 1)
          }}
          onComplete={() => void handleComplete()}
          error={error}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-28 md:pb-6">
      <section className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-5">
        <h1 className="text-xl font-semibold text-[var(--cmd-text)]">{title}</h1>
        {summary ? <p className="mt-2 text-sm text-[var(--cmd-text-muted)]">{summary}</p> : null}
        <p className="mt-2 text-sm text-[var(--cmd-text-muted)]">About {readMinutes} min</p>
      </section>

      <PortalCard title="Read this">
        <TrainingMarkdown text={content} />
      </PortalCard>

      {requiresScenarioGate && quizQuestions.length > 0 && (
        <PortalCard title="Quick check" description="Two simple questions — no timer.">
          <div className="space-y-6">
            {quizQuestions.map((q) => (
              <fieldset key={q.id}>
                <legend className="mb-3 text-base font-medium text-[var(--cmd-text)]">{q.prompt}</legend>
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border border-[var(--cmd-border)] p-3 hover:bg-[var(--cmd-surface-raised)]"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={answers[q.id] === opt.id}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                        className="mt-1"
                      />
                      <span className="text-sm text-[var(--cmd-text)]">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </PortalCard>
      )}

      <div className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4 md:hidden">
        <p className="mb-2 text-sm font-medium text-[var(--cmd-text)]">Confirm before finishing</p>
        <Checkbox
          id="final-attestation-legacy-mobile"
          label={attestationLabel}
          checked={finalAttestation}
          onChange={(e) => setFinalAttestation(e.target.checked)}
        />
      </div>

      <TrainingStickyNav
        stepIndex={0}
        isLastStep
        canAdvance
        submitting={submitting}
        completeLabel={completeLabel}
        requiresScenarioGate={requiresScenarioGate}
        finalAttestation={finalAttestation}
        onFinalAttestationChange={setFinalAttestation}
        onBack={() => {}}
        onContinue={() => {}}
        onComplete={() => void handleComplete()}
        error={error}
      />
    </div>
  )
}
