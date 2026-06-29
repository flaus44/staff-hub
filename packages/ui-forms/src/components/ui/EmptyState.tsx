import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--cmd-border)] bg-[var(--cmd-surface)] px-6 py-12 text-center ${className}`}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(62,106,225,0.15)] text-[var(--cmd-accent)]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--cmd-text)]">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-[var(--cmd-text-muted)]">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
