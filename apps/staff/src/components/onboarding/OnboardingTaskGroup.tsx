import React from 'react'

import { OnboardingTaskTile } from './OnboardingTaskTile'

export function OnboardingTaskGroup({
  title,
  tasks,
}: {
  title: string
  openByDefault?: boolean
  tasks: Array<{
    id: string | number
    title: string
    status: string
    type: string
    href?: string | null
  }>
}) {
  const remaining = tasks.filter((task) => task.status !== 'complete').length

  if (tasks.length === 0) return null

  return (
    <section className="cmd-section-hub">
      <div className="flex items-center justify-between gap-3">
        <h2 className="cmd-section-title">{title}</h2>
        <span className="text-xs text-[var(--cmd-text-muted)]">{remaining} remaining</span>
      </div>
      <div className="cmd-section-grid onboarding-section-grid">
        {tasks.map((task) => (
          <OnboardingTaskTile key={task.id} task={task} />
        ))}
      </div>
    </section>
  )
}
