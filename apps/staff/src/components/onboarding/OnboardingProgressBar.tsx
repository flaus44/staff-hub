'use client'

import { usePathname, useRouter } from 'next/navigation'
import React from 'react'

interface OnboardingProgressBarProps {
  completed: number
  total: number
  className?: string
}

export function OnboardingProgressBar({ completed, total, className = '' }: OnboardingProgressBarProps) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  function goToChecklist() {
    if (pathname === '/onboarding/setup') {
      document.getElementById('onboarding-checklist')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    router.push('/onboarding/setup#onboarding-checklist')
  }

  return (
    <button
      type="button"
      onClick={goToChecklist}
      className={`onboarding-shell-progress w-full ${className}`.trim()}
      aria-label={`${completed} of ${total} onboarding steps complete. View checklist.`}
    >
      <span className="onboarding-shell-progress__label">
        {completed} of {total} complete
      </span>
      <span
        className="onboarding-shell-progress__bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="onboarding-shell-progress__fill" style={{ width: `${percent}%` }} />
      </span>
    </button>
  )
}
