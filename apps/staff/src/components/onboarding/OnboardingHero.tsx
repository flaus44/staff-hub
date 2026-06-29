import React from 'react'

import { OnboardingProgressRing } from './OnboardingProgressRing'

export function OnboardingHero({
  firstName,
  startDateLabel,
  statusLabel,
  completeCount,
  totalCount,
}: {
  firstName?: string
  startDateLabel?: string
  statusLabel: string
  completeCount: number
  totalCount: number
}) {
  return (
    <section className="portal-hero">
      <div className="portal-hero__glow" />
      <div className="portal-hero__content">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="portal-hero__eyebrow">Welcome{firstName ? `, ${firstName}` : ''}</p>
            <h1 className="portal-hero__title">Finish your onboarding setup</h1>
            <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">
              {startDateLabel ? `Start date: ${startDateLabel}` : 'Complete your assigned tasks'}
            </p>
            <p className="mt-2 text-xs text-[var(--cmd-text-muted)]">{statusLabel}</p>
          </div>
          <OnboardingProgressRing value={completeCount} total={totalCount} />
        </div>
      </div>
    </section>
  )
}
