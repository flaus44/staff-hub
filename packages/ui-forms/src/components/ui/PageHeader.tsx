import React from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div>
        {eyebrow && <p className="mb-1 text-sm text-[var(--cmd-text-muted)]">{eyebrow}</p>}
        <h2 className="text-2xl font-semibold text-[var(--cmd-text)] md:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-sm text-[var(--cmd-text-muted)]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
