'use client'

import { Button } from '@flaus/ui-forms/Button'
import { isAllowedTrainingResourceUrl } from '@/lib/training-content-types'

type TrainingResourceBlockProps = {
  resourceUrl: string
  resourceTitle: string
  resourceKind?: 'pdf' | 'link' | 'video'
  downloadable?: boolean
  attribution?: string
}

function ResourceIcon({ kind }: { kind: 'pdf' | 'link' | 'video' }) {
  if (kind === 'pdf') {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    )
  }
  if (kind === 'video') {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

export function TrainingResourceBlock({
  resourceUrl,
  resourceTitle,
  resourceKind = 'link',
  downloadable = false,
  attribution,
}: TrainingResourceBlockProps) {
  const allowed = isAllowedTrainingResourceUrl(resourceUrl)
  const kind = resourceKind ?? 'link'
  const showDownload = downloadable && kind === 'pdf' && allowed

  if (!allowed) {
    return (
      <div className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4 text-sm text-[var(--cmd-text-muted)]">
        Resource unavailable — domain not on FLAUS allowlist.
      </div>
    )
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[rgba(62,106,225,0.12)] text-[var(--cmd-accent)]">
          <ResourceIcon kind={kind} />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[var(--cmd-text)]">{resourceTitle}</h3>
          {attribution ? (
            <p className="mt-0.5 text-sm text-[var(--cmd-text-muted)]">{attribution}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <a href={resourceUrl} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="outline" className="min-h-[44px] rounded-xl px-4">
            Open
          </Button>
        </a>
        {showDownload ? (
          <a href={resourceUrl} download target="_blank" rel="noopener noreferrer">
            <Button type="button" className="min-h-[44px] rounded-xl px-4">
              Download PDF
            </Button>
          </a>
        ) : null}
      </div>
    </article>
  )
}
