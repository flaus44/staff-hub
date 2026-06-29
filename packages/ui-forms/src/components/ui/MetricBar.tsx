import React from 'react'

export type MetricBarDay = {
  label: string
  hours: number
  isToday?: boolean
}

interface MetricBarProps {
  days: MetricBarDay[]
  totalLabel?: string
  maxHours?: number
}

export const MetricBar: React.FC<MetricBarProps> = ({ days, totalLabel, maxHours = 10 }) => {
  const totalHours = days.reduce((sum, d) => sum + d.hours, 0)

  return (
    <div>
      {totalLabel !== undefined ? (
        <p className="text-2xl font-semibold text-[var(--cmd-text)] tabular-nums mb-4">{totalLabel}</p>
      ) : (
        <p className="text-2xl font-semibold text-[var(--cmd-text)] tabular-nums mb-4">
          {totalHours.toFixed(1)}h{' '}
          <span className="text-sm font-normal text-[var(--cmd-text-muted)]">this week</span>
        </p>
      )}
      <div className="flex items-end justify-between gap-2">
        {days.map((day) => {
          const height = Math.min(100, (day.hours / maxHours) * 100)
          return (
            <div key={day.label} className="flex-1 flex flex-col items-center gap-1.5">
              {day.hours > 0 && (
                <span className="text-xs font-medium text-[var(--cmd-text-muted)] tabular-nums">{day.hours.toFixed(1)}h</span>
              )}
              <div
                className={`w-full flex items-end justify-center h-20 rounded-lg overflow-hidden ${
                  day.isToday
                    ? 'bg-[rgba(62,106,225,0.12)] ring-1 ring-[rgba(62,106,225,0.35)]'
                    : 'bg-[var(--cmd-surface-raised)]'
                }`}
              >
                <div
                  className={`w-full rounded-t transition-all ${day.isToday ? 'bg-[var(--cmd-accent)]' : 'bg-[var(--cmd-accent)]/80'}`}
                  style={{ height: `${Math.max(height, day.hours > 0 ? 8 : 0)}%` }}
                  title={`${day.hours.toFixed(1)}h`}
                />
              </div>
              <span
                className={`text-xs font-medium ${day.isToday ? 'text-[var(--cmd-accent)]' : 'text-[var(--cmd-text-muted)]'}`}
              >
                {day.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
