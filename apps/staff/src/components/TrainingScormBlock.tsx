'use client'

import { isAllowedScormLaunchUrl } from '@/lib/training-content-types'

type TrainingScormBlockProps = {
  launchUrl: string
  title?: string
  attribution?: string
}

export function TrainingScormBlock({ launchUrl, title, attribution }: TrainingScormBlockProps) {
  const allowed = isAllowedScormLaunchUrl(launchUrl)

  if (!allowed) {
    return (
      <div className="rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4 text-sm text-[var(--cmd-text-muted)]">
        Course unavailable — launch URL is not on the FLAUS allowlist.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-[var(--cmd-border)] bg-white">
        <iframe
          src={launchUrl}
          title={title ?? 'Training course'}
          className="h-[min(70vh,720px)] w-full"
          allow="fullscreen"
          allowFullScreen
        />
      </div>
      {attribution ? (
        <p className="text-xs text-[var(--cmd-text-muted)]">Source: {attribution}</p>
      ) : null}
    </div>
  )
}
