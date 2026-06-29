'use client'

import { useState } from 'react'

export function PackJoinLinks({
  packs,
}: {
  packs: Array<{ name: string; slug: string; joinUrl: string }>
}) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  async function copyLink(slug: string, url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedSlug(slug)
      window.setTimeout(() => setCopiedSlug(null), 2000)
    } catch {
      window.prompt('Copy this onboarding link:', url)
    }
  }

  if (packs.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4 text-sm text-[var(--cmd-text-muted)]">
        No active onboarding packs yet. Create one in admin to get a shareable link.
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--cmd-text)]">Onboarding links</h2>
        <p className="mt-1 text-xs text-[var(--cmd-text-muted)]">
          Send one of these links to new hires. Each link starts onboarding for that pack — no invite token needed.
        </p>
      </div>
      <ul className="space-y-2">
        {packs.map((pack) => (
          <li
            key={pack.slug}
            className="rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--cmd-text)]">{pack.name}</p>
                <p className="mt-1 break-all text-xs text-[var(--cmd-text-muted)]">{pack.joinUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => copyLink(pack.slug, pack.joinUrl)}
                className="shrink-0 rounded-lg border border-[var(--cmd-border)] px-3 py-1.5 text-xs font-medium text-[var(--cmd-text)] hover:border-[var(--cmd-accent)] hover:text-[var(--cmd-accent)]"
              >
                {copiedSlug === pack.slug ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
