import Link from 'next/link'
import React, { type CSSProperties } from 'react'

import { PortalIcon } from '@/components/portal-icons'
import {
  onboardingTaskAccent,
  onboardingTaskDisplayTitle,
  onboardingTaskIcon,
} from '@/lib/onboarding/task-tile-meta'

import { OnboardingStatusChip } from './OnboardingStatusChip'

export function OnboardingTaskTile({
  task,
}: {
  task: {
    id: string | number
    title: string
    status: string
    type: string
    href?: string | null
  }
}) {
  const href = task.href || `/onboarding/tasks/${task.id}`
  const accent = onboardingTaskAccent(task.type, task.status)
  const icon = onboardingTaskIcon(task.type)
  const isComplete = task.status === 'complete'
  const displayTitle = onboardingTaskDisplayTitle(task)

  const accentStyle = {
    '--tile-accent-bg': accent.bg,
    '--tile-accent-fg': accent.fg,
  } as CSSProperties

  return (
    <Link
      href={href}
      className={`cmd-section-tile${isComplete ? ' cmd-section-tile--complete' : ''}`}
      style={accentStyle}
      title={displayTitle}
    >
      <span className="cmd-section-tile__icon">
        <PortalIcon name={icon} size="xl" variant="tile" />
      </span>
      <span className="cmd-section-tile__title">{displayTitle}</span>
      <span className="cmd-section-tile__status">
        <OnboardingStatusChip status={task.status} />
      </span>
    </Link>
  )
}
