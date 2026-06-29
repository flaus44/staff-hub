'use client'

import { type ReactNode, type Ref } from 'react'

import { IconBook, IconPlay } from '@/components/portal-icons'
import { Button } from '@flaus/ui-forms/Button'
import { StatusPill } from '@flaus/ui-forms/StatusPill'

type TrainingMediaCardProps = {
  id: string
  title: string
  summary?: string
  readMinutes: number
  kind: 'video' | 'scorm'
  isOpen: boolean
  watched?: boolean
  badge?: string
  thumbnailUrl?: string
  onToggle: () => void
  href?: string
  children?: ReactNode
  footer?: ReactNode
  justCompleted?: boolean
  expandButtonRef?: Ref<HTMLButtonElement>
  cardRef?: Ref<HTMLElement>
}

export function TrainingMediaCard({
  id,
  title,
  summary,
  readMinutes,
  kind,
  isOpen,
  watched = false,
  badge,
  thumbnailUrl,
  onToggle,
  href,
  children,
  footer,
  justCompleted = false,
  expandButtonRef,
  cardRef,
}: TrainingMediaCardProps) {
  const Icon = kind === 'video' ? IconPlay : IconBook
  const statusLabel = watched ? 'Complete' : 'Not started'
  const statusVariant = watched ? 'success' : 'neutral'

  return (
    <article
      ref={cardRef}
      id={id}
      className={`rounded-xl border bg-[var(--cmd-surface-raised)] p-4 transition-[box-shadow,border-color] duration-300 ${
        justCompleted
          ? 'border-[var(--cmd-live)] shadow-[0_0_0_2px_rgba(var(--cmd-live-rgb,34,197,94),0.25)]'
          : 'border-[var(--cmd-border)]'
      }`}
    >
      <div className="flex items-start gap-3">
        {thumbnailUrl && kind === 'video' && !isOpen ? (
          <button
            type="button"
            onClick={onToggle}
            className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-[var(--cmd-border)] bg-black"
            aria-label={`Preview ${title}`}
          >
            <img
              src={thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
              <Icon />
            </span>
          </button>
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(62,106,225,0.12)] text-[var(--cmd-accent)]">
            <Icon />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[var(--cmd-text)]">{title}</h3>
              {badge ? (
                <span className="mt-1 inline-block rounded-full bg-[rgba(62,106,225,0.12)] px-2 py-0.5 text-xs font-medium text-[var(--cmd-accent)]">
                  {badge}
                </span>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--cmd-surface)] px-2.5 py-1 text-xs font-medium text-[var(--cmd-text-muted)]">
                ~{readMinutes} min
              </span>
              <StatusPill status={statusLabel} variant={statusVariant} />
            </div>
          </div>
          {summary ? (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--cmd-text-muted)]">{summary}</p>
          ) : null}
          <div className="mt-3">
            {href ? (
              <Link href={href} className="inline-block no-underline">
                <Button variant="primary" className="min-h-[44px] rounded-xl text-sm">
                  Start
                </Button>
              </Link>
            ) : (
              <Button
                ref={expandButtonRef}
                type="button"
                variant={isOpen ? 'outline' : 'primary'}
                className="min-h-[44px] rounded-xl text-sm"
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls={`${id}-content`}
              >
                {watched ? (isOpen ? 'Close' : 'Review') : isOpen ? 'Close' : 'Watch'}
              </Button>
            )}
          </div>
        </div>
      </div>
      {isOpen && children ? (
        <div id={`${id}-content`} className="mt-4 border-t border-[var(--cmd-border)] pt-4">
          {children}
          {footer}
        </div>
      ) : null}
      <span className="sr-only">Training video</span>
    </article>
  )
}
