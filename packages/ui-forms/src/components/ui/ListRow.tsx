import React from 'react'

interface ListRowProps {
  icon?: React.ReactNode
  primary: React.ReactNode
  secondary?: React.ReactNode
  meta?: React.ReactNode
  trailing?: React.ReactNode
  showChevron?: boolean
  className?: string
  onClick?: () => void
}

export const ListRow: React.FC<ListRowProps> = ({
  icon,
  primary,
  secondary,
  meta,
  trailing,
  showChevron = false,
  className = '',
  onClick,
}) => {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-start gap-3 py-3.5 text-left border-b border-[var(--cmd-border)] last:border-0 ${
        onClick ? 'hover:bg-[var(--cmd-surface-raised)] transition-colors cursor-pointer' : ''
      } ${className}`}
    >
      {icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(62,106,225,0.15)] text-[var(--cmd-accent)]">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--cmd-text)]">{primary}</p>
        {secondary && <p className="text-sm text-[var(--cmd-text-muted)] mt-0.5">{secondary}</p>}
        {meta && <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--cmd-text-muted)]">{meta}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:items-start">
        {trailing}
        {showChevron && (
          <svg
            className="h-5 w-5 text-[var(--cmd-text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </Tag>
  )
}
