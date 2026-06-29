import React from 'react'

interface SectionHeaderProps {
  children: React.ReactNode
  className?: string
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`text-xs font-semibold uppercase tracking-wider text-[var(--cmd-text-muted)] bg-[var(--cmd-surface-raised)] px-3 py-2 rounded-lg mb-1 mt-3 first:mt-0 ${className}`}
    >
      {children}
    </div>
  )
}
