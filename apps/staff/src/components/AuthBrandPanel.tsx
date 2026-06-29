import React from 'react'

interface AuthBrandPanelProps {
  title?: string
  subtitle?: string
}

export function AuthBrandPanel({
  title = 'Staff Hub',
  subtitle = "Timesheets, training, contracts, surveys and incident reporting for Financial Literacy Australia's Staff",
}: AuthBrandPanelProps) {
  return (
    <div className="hidden lg:flex portal-auth-panel">
      <div className="portal-auth-panel__glow" aria-hidden />
      <div className="portal-auth-panel__content">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--cmd-accent)]">
          Financial Literacy Australia
        </p>
        <h1 className="text-4xl font-semibold mt-6 leading-tight text-[var(--cmd-text)]">{title}</h1>
        <p className="text-[var(--cmd-text-muted)] mt-4 text-lg max-w-md leading-relaxed">{subtitle}</p>
      </div>
    </div>
  )
}

export function AuthMobileHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="lg:hidden mb-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cmd-accent)]">FLAUS Staff Hub</p>
      <h1 className="text-2xl font-semibold text-[var(--cmd-text)] mt-1">{title}</h1>
      {subtitle && <p className="text-sm text-[var(--cmd-text-muted)] mt-1">{subtitle}</p>}
    </div>
  )
}
