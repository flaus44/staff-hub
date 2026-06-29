import Link from 'next/link'
import React from 'react'

import { Button } from '@flaus/ui-forms/Button'
import {
  onboardingStepFocusCtaIsStartHere,
  onboardingStepFocusCtaLabel,
  onboardingTaskDescription,
  onboardingTaskDisplayTitle,
} from '@/lib/onboarding/task-tile-meta'

type FocusTask = {
  id: string | number
  title: string
  type: string
  status: string
  href?: string | null
}

function allCompleteMessage(
  assignmentStatus?: string,
  onboardingStatus?: string,
): { title: string; description: string } {
  if (['approved', 'active'].includes(onboardingStatus ?? '')) {
    return {
      title: 'Onboarding approved',
      description: 'HR has verified your onboarding. You can use the full staff portal.',
    }
  }
  if (
    ['submitted', 'pending_admin_review'].includes(assignmentStatus ?? '') ||
    onboardingStatus === 'submitted' ||
    onboardingStatus === 'pending_admin_review'
  ) {
    return {
      title: 'All steps complete',
      description:
        'Your onboarding has been sent to HR for verification. Access will unlock once HR confirms everything is accurate.',
    }
  }
  return {
    title: 'All steps complete',
    description:
      'Your onboarding will be sent to HR automatically. Access will unlock once HR verifies your details.',
  }
}

export function OnboardingStepFocus({
  firstName,
  completedCount,
  totalCount,
  nextTask,
  assignmentStatus,
  onboardingStatus,
}: {
  firstName?: string
  completedCount: number
  totalCount: number
  nextTask: FocusTask | null
  assignmentStatus?: string
  onboardingStatus?: string
}) {
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const allComplete = totalCount > 0 && completedCount >= totalCount
  const completeCopy = allCompleteMessage(assignmentStatus, onboardingStatus)

  return (
    <section className="onboarding-step-focus">
      <div className="onboarding-step-focus__header">
        <p className="onboarding-step-focus__greeting">
          Welcome{firstName ? `, ${firstName}` : ''}
        </p>
        {totalCount > 0 ? (
          <p className="onboarding-step-focus__step-label">
            {allComplete
              ? `${totalCount} of ${totalCount} complete`
              : `Step ${completedCount + 1} of ${totalCount}`}
          </p>
        ) : null}
        <div
          className="onboarding-step-focus__progress"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Onboarding progress"
        >
          <div
            className="onboarding-step-focus__progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {allComplete ? (
        <div className="onboarding-step-focus__card onboarding-step-focus__card--complete">
          <h2 className="onboarding-step-focus__title">{completeCopy.title}</h2>
          <p className="onboarding-step-focus__description">{completeCopy.description}</p>
        </div>
      ) : nextTask ? (
        <div className="onboarding-step-focus__card onboarding-step-focus__card--active">
          <p className="onboarding-step-focus__eyebrow">Current step</p>
          <h2 className="onboarding-step-focus__title">
            {onboardingTaskDisplayTitle(nextTask)}
          </h2>
          <p className="onboarding-step-focus__description">
            {onboardingTaskDescription(nextTask.type)}
          </p>
          <div className="onboarding-step-focus__cta">
            <Link href={nextTask.href || `/onboarding/tasks/${nextTask.type}`}>
              <Button
                className={
                  onboardingStepFocusCtaIsStartHere(completedCount, nextTask.status)
                    ? 'rounded-full px-4 !bg-[rgba(48,209,88,0.15)] !text-[var(--cmd-live)] hover:!bg-[rgba(48,209,88,0.22)] focus:!ring-[rgba(48,209,88,0.35)]'
                    : 'rounded-full px-4'
                }
              >
                {onboardingStepFocusCtaLabel(nextTask.status, completedCount)}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="onboarding-step-focus__card">
          <h2 className="onboarding-step-focus__title">No tasks assigned</h2>
          <p className="onboarding-step-focus__description">
            Your onboarding checklist will appear here once tasks are assigned.
          </p>
        </div>
      )}
    </section>
  )
}
