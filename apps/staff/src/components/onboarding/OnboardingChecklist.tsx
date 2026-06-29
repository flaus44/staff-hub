'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'

import { IconCheck, IconChevronRight } from '@/components/portal-icons'
import {
  onboardingTaskCtaLabel,
  onboardingTaskDisplayTitle,
} from '@/lib/onboarding/task-tile-meta'
import type { OnboardingDisplaySection } from '@/lib/onboarding/task-sections'

import { OnboardingStatusChip } from './OnboardingStatusChip'

type ChecklistTask = {
  id: string | number
  title: string
  status: string
  type: string
  href?: string | null
}

type ChecklistGroup = {
  section: OnboardingDisplaySection
  title: string
  tasks: ChecklistTask[]
}

function allExpandedSections(groups: ChecklistGroup[]): Set<OnboardingDisplaySection> {
  return new Set(groups.map((group) => group.section))
}

function showStatusChip(status: string): boolean {
  return ['in_progress', 'awaiting_review', 'rejected', 'blocked'].includes(status)
}

export function OnboardingChecklist({
  groups,
  nextTask,
}: {
  groups: ChecklistGroup[]
  nextTask: ChecklistTask | null
}) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<OnboardingDisplaySection>>(() =>
    allExpandedSections(groups),
  )

  useEffect(() => {
    if (window.location.hash === '#onboarding-checklist') {
      document.getElementById('onboarding-checklist')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  const orderedTasks = useMemo(() => groups.flatMap((group) => group.tasks), [groups])
  const stepNumberById = useMemo(
    () => new Map(orderedTasks.map((task, index) => [String(task.id), index + 1])),
    [orderedTasks],
  )

  const completedCount = orderedTasks.filter((task) => task.status === 'complete').length

  function toggleSection(section: OnboardingDisplaySection) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  if (orderedTasks.length === 0) return null

  return (
    <section id="onboarding-checklist" className="onboarding-checklist">
      <h2 className="onboarding-checklist__heading">Your checklist</h2>

      <div className="onboarding-checklist__groups">
        {groups.map((group) => {
          const visibleTasks = group.tasks.filter(
            (task) => showCompleted || task.status !== 'complete',
          )
          const expanded = expandedSections.has(group.section)

          if (visibleTasks.length === 0 && !showCompleted) return null

          return (
            <div key={group.section} className="onboarding-checklist__group">
              <button
                type="button"
                className={`onboarding-checklist__group-toggle${
                  expanded ? ' onboarding-checklist__group-toggle--expanded' : ''
                }`}
                onClick={() => toggleSection(group.section)}
                aria-expanded={expanded}
              >
                <span className="onboarding-checklist__group-title">{group.title}</span>
                <IconChevronRight
                  size="sm"
                  variant="default"
                />
              </button>

              {expanded ? (
                <ul className="onboarding-checklist__rows">
                  {visibleTasks.map((task) => {
                    const href = task.href || `/onboarding/tasks/${task.type}`
                    const isNext = nextTask ? String(nextTask.id) === String(task.id) : false
                    const isComplete = task.status === 'complete'
                    const isRejected = task.status === 'rejected'
                    const stepNumber = stepNumberById.get(String(task.id)) ?? 0
                    const ctaLabel = onboardingTaskCtaLabel(task.status)
                    const showChip = showStatusChip(task.status)

                    return (
                      <li key={task.id}>
                        <Link
                          href={href}
                          className={`onboarding-checklist__row${
                            isNext ? ' onboarding-checklist__row--next' : ''
                          }${isComplete ? ' onboarding-checklist__row--complete' : ''}${
                            isRejected ? ' onboarding-checklist__row--rejected' : ''
                          }`}
                          aria-current={isNext ? 'step' : undefined}
                        >
                          <span
                            className={`onboarding-checklist__step${
                              isComplete ? ' onboarding-checklist__step--complete' : ''
                            }`}
                          >
                            {isComplete ? <IconCheck size="sm" /> : stepNumber}
                          </span>
                          <span className="onboarding-checklist__content">
                            <span className="onboarding-checklist__task-title">
                              {onboardingTaskDisplayTitle(task)}
                            </span>
                            {showChip ? <OnboardingStatusChip status={task.status} /> : null}
                          </span>
                          {!isComplete ? (
                            <span className="onboarding-checklist__cta">{ctaLabel}</span>
                          ) : null}
                          <span className="onboarding-checklist__row-chevron" aria-hidden>
                            <IconChevronRight size="sm" variant="default" />
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </div>
          )
        })}
      </div>

      {completedCount > 0 ? (
        <button
          type="button"
          className="onboarding-checklist__toggle-completed"
          onClick={() => setShowCompleted((prev) => !prev)}
        >
          {showCompleted ? 'Hide completed' : `Show completed (${completedCount})`}
        </button>
      ) : null}
    </section>
  )
}
