import React from 'react'

const STYLE_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: 'To do', className: 'bg-[var(--cmd-surface-raised)] text-[var(--cmd-text-muted)]' },
  in_progress: { label: 'In progress', className: 'bg-[rgba(62,106,225,0.2)] text-[var(--cmd-accent)]' },
  awaiting_review: { label: 'In review', className: 'bg-[rgba(255,159,10,0.2)] text-[var(--cmd-warn)]' },
  complete: { label: 'Done', className: 'bg-[rgba(48,209,88,0.2)] text-[var(--cmd-live)]' },
  rejected: { label: 'Needs update', className: 'bg-[rgba(255,69,58,0.2)] text-[var(--cmd-critical)]' },
  blocked: { label: 'Blocked', className: 'bg-[rgba(255,69,58,0.2)] text-[var(--cmd-critical)]' },
  approved: { label: 'Approved', className: 'bg-[rgba(48,209,88,0.2)] text-[var(--cmd-live)]' },
  submitted: { label: 'Submitted', className: 'bg-[rgba(255,159,10,0.2)] text-[var(--cmd-warn)]' },
}

export function OnboardingStatusChip({ status }: { status: string }) {
  const spec = STYLE_MAP[status] ?? { label: status, className: 'bg-[var(--cmd-surface-raised)] text-[var(--cmd-text-muted)]' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${spec.className}`}>
      {spec.label}
    </span>
  )
}
