'use client'

import type { TrainingContentBlock } from '@/lib/training-content-types'
import { estimateRemainingMinutes } from '@/lib/training-content-types'

type TrainingModuleHeroProps = {
  title: string
  summary?: string
  stepIndex: number
  totalSteps: number
  steps: TrainingContentBlock[]
  jobAidHref?: string
}

export function TrainingModuleHero({
  title,
  summary,
  stepIndex,
  totalSteps,
  steps,
  jobAidHref,
}: TrainingModuleHeroProps) {
  const progressPercent = totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0
  const remainingMinutes = estimateRemainingMinutes(steps, stepIndex)

  return (
    <section className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cmd-text-muted)]">
        Training module
      </p>
      <h1 className="mt-1 text-xl font-semibold text-[var(--cmd-text)]">{title}</h1>
      {summary ? <p className="mt-2 text-sm leading-relaxed text-[var(--cmd-text-muted)]">{summary}</p> : null}
      <p className="mt-3 text-sm font-medium text-[var(--cmd-text)]">
        Step {stepIndex + 1} of {totalSteps} · ~{remainingMinutes} min left
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cmd-border)]"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Module progress ${progressPercent}%`}
      >
        <div
          className="h-full rounded-full bg-[var(--cmd-accent)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--cmd-text-muted)]">
        One screen at a time. Your place is saved automatically.
      </p>
      {jobAidHref ? (
        <a
          href={jobAidHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--cmd-accent)] underline"
        >
          Open facilitator cheat sheet
        </a>
      ) : null}
    </section>
  )
}
