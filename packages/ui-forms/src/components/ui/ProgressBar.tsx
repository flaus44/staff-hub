import React from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercent?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = true,
  className = '',
}) => {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0

  return (
    <div className={className}>
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && <span className="font-medium text-[var(--cmd-text)]">{label}</span>}
          {showPercent && <span className="text-[var(--cmd-text-muted)]">{percent}%</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-[var(--cmd-surface-raised)]">
        <div
          className="h-full rounded-full bg-[var(--cmd-accent)] transition-all duration-300"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}
