import Link from 'next/link'
import React from 'react'

import { Button } from '@flaus/ui-forms/Button'
import { onboardingTaskDisplayTitle } from '@/lib/onboarding/task-tile-meta'

export function OnboardingNextCard({
  task,
}: {
  task:
    | {
        id: string | number
        title: string
        type: string
        href?: string | null
      }
    | null
}) {
  const displayTitle = task ? onboardingTaskDisplayTitle(task) : null

  if (!task) {
    return (
      <section className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] px-4 py-4">
        <p className="text-xs uppercase tracking-wide text-[var(--cmd-text-muted)]">Next action</p>
        <h2 className="mt-1 text-base font-semibold text-[var(--cmd-text)]">Everything is complete</h2>
        <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">
          HR will verify your onboarding once every step is complete.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] px-4 py-4">
      <p className="text-xs uppercase tracking-wide text-[var(--cmd-text-muted)]">Next action</p>
      <h2 className="mt-1 text-base font-semibold text-[var(--cmd-text)]">{displayTitle ?? task.title}</h2>
      <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">Complete this step to keep onboarding moving.</p>
      <div className="mt-3">
        <Link href={task.href || `/onboarding/tasks/${task.id}`}>
          <Button className="rounded-full px-4">Continue</Button>
        </Link>
      </div>
    </section>
  )
}
