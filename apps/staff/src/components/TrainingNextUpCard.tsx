'use client'

import Link from 'next/link'

import { Button } from '@flaus/ui-forms/Button'

export type TrainingNextUpAction =
  | {
      kind: 'module'
      title: string
      description: string
      href: string
      cta: string
    }
  | {
      kind: 'videos'
      remaining: number
      description: string
      onScrollToVideos: () => void
    }
  | {
      kind: 'complete'
      title: string
      description: string
    }

type TrainingNextUpCardProps = {
  action: TrainingNextUpAction | null
}

export function TrainingNextUpCard({ action }: TrainingNextUpCardProps) {
  if (!action) return null

  if (action.kind === 'complete') {
    return (
      <section
        aria-label="Next up"
        className="mb-6 rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--cmd-text-muted)]">Next up</p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--cmd-text)]">{action.title}</h2>
        <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">{action.description}</p>
      </section>
    )
  }

  return (
    <section
      aria-label="Next up"
      className="mb-6 rounded-xl border border-[rgba(62,106,225,0.35)] bg-[rgba(62,106,225,0.08)] p-4"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--cmd-accent)]">Next up</p>
      {action.kind === 'module' ? (
        <>
          <h2 className="mt-1 text-lg font-semibold text-[var(--cmd-text)]">{action.title}</h2>
          <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">{action.description}</p>
          <div className="mt-3">
            <Link href={action.href} className="inline-block no-underline">
              <Button variant="primary" className="min-h-[44px] rounded-xl text-sm">
                {action.cta}
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-1 text-lg font-semibold text-[var(--cmd-text)]">
            Watch {action.remaining} remaining WHS {action.remaining === 1 ? 'video' : 'videos'}
          </h2>
          <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">{action.description}</p>
          <div className="mt-3">
            <Button
              type="button"
              variant="primary"
              className="min-h-[44px] rounded-xl text-sm"
              onClick={action.onScrollToVideos}
            >
              Open WorkSafe videos
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
