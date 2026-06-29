import React from 'react'

type PortalCardVariant = 'default' | 'accent' | 'success' | 'warning'

interface PortalCardProps {
  title?: string
  eyebrow?: string
  description?: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  headerAction?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  variant?: PortalCardVariant
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

const variantClasses: Record<PortalCardVariant, string> = {
  default: 'border-[var(--cmd-border)] bg-[var(--cmd-surface)]',
  accent: 'border-[rgba(62,106,225,0.35)] bg-[var(--cmd-surface)]',
  success: 'border-[rgba(48,209,88,0.35)] bg-[var(--cmd-surface)]',
  warning: 'border-[rgba(255,159,10,0.35)] bg-[var(--cmd-surface)]',
}

export const PortalCard: React.FC<PortalCardProps> = ({
  title,
  eyebrow,
  description,
  icon,
  badge,
  headerAction,
  footer,
  children,
  className = '',
  padding = 'md',
  variant = 'default',
}) => {
  const hasHeader = eyebrow || title || description || icon || badge || headerAction

  return (
    <div
      className={`rounded-2xl border ${paddingClasses[padding]} ${variantClasses[variant]} ${className}`}
    >
      {hasHeader && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(62,106,225,0.15)] text-[var(--cmd-accent)]">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--cmd-text-muted)]">{eyebrow}</p>
              )}
              {title && <h3 className="text-sm font-semibold text-[var(--cmd-text)]">{title}</h3>}
              {description && <p className="text-sm text-[var(--cmd-text-muted)] mt-0.5">{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {badge}
            {headerAction}
          </div>
        </div>
      )}
      {children}
      {footer && <div className="mt-4 border-t border-[var(--cmd-border)] pt-4">{footer}</div>}
    </div>
  )
}
