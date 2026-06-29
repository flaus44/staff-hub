import React from 'react'

export function OnboardingProgressRing({
  value,
  total,
  size = 88,
}: {
  value: number
  total: number
  size?: number
}) {
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((value / total) * 100))) : 0
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (pct / 100) * circumference

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
        aria-label={`${value} of ${total} complete`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--cmd-border)"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--cmd-live)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            fill="transparent"
          />
        </svg>
        <span className="absolute text-sm font-semibold text-[var(--cmd-text)]">{pct}%</span>
      </div>
      <div className="text-xs text-[var(--cmd-text-muted)]">
        <p className="text-sm font-medium text-[var(--cmd-text)]">
          {value} of {total}
        </p>
        <p>complete</p>
      </div>
    </div>
  )
}
