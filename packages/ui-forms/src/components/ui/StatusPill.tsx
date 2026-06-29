import React from 'react'

interface StatusPillProps {
  status: string
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
}

const variantClasses: Record<NonNullable<StatusPillProps['variant']>, string> = {
  success: 'bg-[rgba(48,209,88,0.15)] text-[var(--cmd-live)]',
  warning: 'bg-[rgba(255,159,10,0.15)] text-[var(--cmd-warn)]',
  danger: 'bg-[rgba(255,69,58,0.15)] text-[var(--cmd-critical)]',
  neutral: 'bg-[var(--cmd-surface-raised)] text-[var(--cmd-text-muted)]',
  info: 'bg-[rgba(62,106,225,0.15)] text-[var(--cmd-accent)]',
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, variant = 'neutral' }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {status}
    </span>
  )
}
