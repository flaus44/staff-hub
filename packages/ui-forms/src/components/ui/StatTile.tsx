import React from 'react'

interface StatTileProps {
  label: string
  value: number | string
  accentClass?: string
  className?: string
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  accentClass = 'border-l-[var(--cmd-accent)]',
  className = '',
}) => {
  return (
    <div
      className={`group rounded-2xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-5 border-l-4 ${accentClass} hover:border-[var(--cmd-text-muted)] transition-colors h-full ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-3xl font-semibold text-[var(--cmd-text)] tabular-nums">{value}</p>
          <p className="text-sm text-[var(--cmd-text-muted)] mt-1">{label}</p>
        </div>
        <svg
          className="h-5 w-5 text-[var(--cmd-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}
