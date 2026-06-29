import React from 'react'

import { PortalIcon } from '@/components/portal-icons'

export function OnboardingDocumentRow({
  documentId,
  title,
  issuedAt,
  prominent = false,
}: {
  documentId: string
  title: string
  issuedAt?: string
  prominent?: boolean
}) {
  const href = `/api/portal/onboarding/documents/download?documentId=${encodeURIComponent(documentId)}&disposition=attachment`
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
        prominent
          ? 'border-[rgba(62,106,225,0.45)] bg-[rgba(62,106,225,0.08)]'
          : 'border-[var(--cmd-border)] bg-[var(--cmd-surface)]'
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(62,106,225,0.2)] text-[var(--cmd-accent)]">
        <PortalIcon name="document" size="sm" variant="tile" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--cmd-text)]">{title}</p>
        <p className="text-xs text-[var(--cmd-text-muted)]">
          {issuedAt ? new Date(issuedAt).toLocaleDateString('en-AU') : 'Generated document'}
        </p>
      </div>
      <a
        href={href}
        className="inline-flex min-h-[36px] items-center rounded-lg border border-[var(--cmd-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--cmd-text)] no-underline hover:bg-[var(--cmd-surface-raised)]"
      >
        Download
      </a>
    </div>
  )
}
