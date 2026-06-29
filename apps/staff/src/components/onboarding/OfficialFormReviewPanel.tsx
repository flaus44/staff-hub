'use client'

import { Checkbox } from '@flaus/ui-forms/Checkbox'

type ReviewForm = {
  id: string
  title: string
  verifyLabel: string
  blobUrl: string
  verified: boolean
}

export function OfficialFormReviewPanel({
  forms,
  loading,
  error,
  stale,
  staleMessage,
  showVerification = true,
  onToggleVerified,
}: {
  forms: ReviewForm[]
  loading: boolean
  error?: string
  stale?: boolean
  staleMessage?: string
  showVerification?: boolean
  onToggleVerified?: (formId: string, verified: boolean) => void
}) {
  return (
    <section className="space-y-4">
      {stale ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {staleMessage || 'Your details changed. Review your forms again before submitting.'}
        </p>
      ) : null}
      {loading ? (
        <div className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4 text-sm text-[var(--cmd-text-muted)]">
          Preparing your official form preview…
        </div>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-[var(--cmd-critical)]/35 bg-[var(--cmd-critical)]/10 px-3 py-2 text-sm text-[var(--cmd-critical)]">
          {error}
        </p>
      ) : null}
      {forms.map((form) => (
        <article
          key={form.id}
          className="overflow-hidden rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[var(--cmd-border)] px-4 py-3">
            <h4 className="text-sm font-semibold text-[var(--cmd-text)]">{form.title}</h4>
            <a
              href={form.blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--cmd-accent)]"
            >
              Open full screen
            </a>
          </div>
          <object data={`${form.blobUrl}#view=FitH&toolbar=0`} type="application/pdf" className="h-[60vh] min-h-[360px] w-full bg-white md:h-[70vh]">
            <iframe title={`${form.title} preview`} src={form.blobUrl} className="h-[60vh] min-h-[360px] w-full bg-white md:h-[70vh]" />
          </object>
          {showVerification ? (
            <div className="border-t border-[var(--cmd-border)] px-4 py-3">
              <Checkbox
                id={`verify-${form.id}`}
                label={form.verifyLabel}
                checked={form.verified}
                onChange={(event) => onToggleVerified?.(form.id, event.target.checked)}
              />
            </div>
          ) : null}
        </article>
      ))}
    </section>
  )
}
