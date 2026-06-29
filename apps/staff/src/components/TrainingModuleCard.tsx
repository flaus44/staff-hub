'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { IconBook } from '@/components/portal-icons'
import { Button } from '@flaus/ui-forms/Button'
import { StatusPill } from '@flaus/ui-forms/StatusPill'
import { trainingStepStorageKey } from '@/lib/training-content-types'

type TrainingModuleCardProps = {
  moduleId: string
  slug: string
  title: string
  summary?: string
  readMinutes: number
  done: boolean
  stale: boolean
  detailSegment: 'training' | 'policies'
  moduleType: 'training' | 'policy_procedure'
}

function ctaLabel(done: boolean, stale: boolean, hasResume: boolean): string {
  if (stale) return 'Update'
  if (done) return 'Review'
  if (hasResume) return 'Resume'
  return 'Start'
}

export function TrainingModuleCard({
  moduleId,
  slug,
  title,
  summary,
  readMinutes,
  done,
  stale,
  detailSegment,
  moduleType,
}: TrainingModuleCardProps) {
  const [hasResume, setHasResume] = useState(false)

  useEffect(() => {
    let next = false
    if (!done && !stale) {
      try {
        const saved = localStorage.getItem(trainingStepStorageKey(moduleId))
        const idx = saved ? parseInt(saved, 10) : 0
        next = !Number.isNaN(idx) && idx > 0
      } catch {
        next = false
      }
    }
    setHasResume((prev) => (prev === next ? prev : next))
  }, [moduleId, done, stale])

  let statusLabel = 'Not started'
  let statusVariant: 'success' | 'neutral' | 'warning' = 'neutral'
  if (done) {
    statusLabel = 'Complete'
    statusVariant = 'success'
  } else if (stale) {
    statusLabel = 'Update available'
    statusVariant = 'warning'
  } else if (hasResume) {
    statusLabel = 'In progress'
    statusVariant = 'neutral'
  }

  const label = ctaLabel(done, stale, hasResume)

  return (
    <article className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(62,106,225,0.12)] text-[var(--cmd-accent)]">
          <IconBook />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-[var(--cmd-text)]">{title}</h2>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--cmd-surface)] px-2.5 py-1 text-xs font-medium text-[var(--cmd-text-muted)]">
                ~{readMinutes} min
              </span>
              <StatusPill status={statusLabel} variant={statusVariant} />
            </div>
          </div>
          {summary ? (
            <p className="mt-1 line-clamp-1 text-sm text-[var(--cmd-text-muted)]">{summary}</p>
          ) : null}
          <div className="mt-3">
            <Link href={`/${detailSegment}/${slug}`}>
              <Button
                variant={done && !stale ? 'outline' : 'primary'}
                className="min-h-[44px] rounded-xl text-sm"
              >
                {label}
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <span className="sr-only">
        {moduleType === 'policy_procedure' ? 'Policy module' : 'Training module'}
      </span>
    </article>
  )
}
