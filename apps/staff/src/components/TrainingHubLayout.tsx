'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { TrainingHubMediaSections } from '@/components/TrainingHubMediaSections'
import { TrainingModuleCard } from '@/components/TrainingModuleCard'
import { TrainingNextUpCard, type TrainingNextUpAction } from '@/components/TrainingNextUpCard'
import { IconChevronRight } from '@/components/portal-icons'
import { EmptyState } from '@flaus/ui-forms/EmptyState'
import { ProgressBar } from '@flaus/ui-forms/ProgressBar'
import type { LearningModuleType } from '@/lib/learning-modules'
import { WHS_WORKSAFE_VIDEOS } from '@/lib/training-content-seeds'
import { trainingStepStorageKey } from '@/lib/training-content-types'
import { HUB_VIDEO_IDS, useTrainingVideoProgress } from '@/lib/training-video-progress'

export type TrainingHubModuleItem = {
  moduleId: string
  slug: string
  title: string
  summary?: string
  readMinutes: number
  done: boolean
  stale: boolean
}

type TrainingHubLayoutProps = {
  modules: TrainingHubModuleItem[]
  detailSegment: 'training' | 'policies'
  moduleType: LearningModuleType
  emptyTitle: string
  emptyDescription: string
}

function moduleHasResume(moduleId: string): boolean {
  try {
    const saved = localStorage.getItem(trainingStepStorageKey(moduleId))
    const idx = saved ? parseInt(saved, 10) : 0
    return !Number.isNaN(idx) && idx > 0
  } catch {
    return false
  }
}

export function TrainingHubLayout({
  modules,
  detailSegment,
  moduleType,
  emptyTitle,
  emptyDescription,
}: TrainingHubLayoutProps) {
  const videoSectionRef = useRef<HTMLElement>(null)
  const { watchedCount } = useTrainingVideoProgress(HUB_VIDEO_IDS)
  const [videosExpanded, setVideosExpanded] = useState(false)
  const modulesProgressKey = useMemo(
    () => modules.map((mod) => `${mod.moduleId}:${mod.done}:${mod.stale}`).join('|'),
    [modules],
  )

  const moduleCompletedCount = modules.filter((mod) => mod.done).length
  const totalItems = modules.length + HUB_VIDEO_IDS.length
  const overallCompleted = moduleCompletedCount + watchedCount

  const scrollToVideos = useCallback(() => {
    setVideosExpanded(true)
    requestAnimationFrame(() => {
      videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const nextUpAction = useMemo((): TrainingNextUpAction | null => {
    const remainingVideos = HUB_VIDEO_IDS.length - watchedCount

    const resumeModule = modules.find((mod) => !mod.done && !mod.stale && moduleHasResume(mod.moduleId))
    if (resumeModule) {
      return {
        kind: 'module',
        title: resumeModule.title,
        description: resumeModule.summary ?? 'Pick up where you left off.',
        href: `/${detailSegment}/${resumeModule.slug}`,
        cta: 'Resume',
      }
    }

    if (remainingVideos > 0) {
      return {
        kind: 'videos',
        remaining: remainingVideos,
        description:
          'These WorkSafe clips are part of WHS Induction. Watch them on the hub before continuing in the module.',
        onScrollToVideos: scrollToVideos,
      }
    }

    const nextModule = modules.find((mod) => !mod.done)
    if (nextModule) {
      return {
        kind: 'module',
        title: nextModule.title,
        description: nextModule.summary ?? 'Continue your training path.',
        href: `/${detailSegment}/${nextModule.slug}`,
        cta: 'Start',
      }
    }

    if (modules.length > 0 || HUB_VIDEO_IDS.length > 0) {
      return {
        kind: 'complete',
        title: 'All training complete',
        description: 'You have finished every module and WorkSafe video on this page.',
      }
    }

    return null
  }, [modules, modulesProgressKey, detailSegment, watchedCount, scrollToVideos])

  useEffect(() => {
    if (watchedCount < HUB_VIDEO_IDS.length) {
      setVideosExpanded((open) => (open ? open : true))
    }
  }, [watchedCount])

  const totalVideoMinutes = WHS_WORKSAFE_VIDEOS.reduce(
    (sum, video) => sum + (video.durationMinutes ?? 3),
    0,
  )

  return (
    <>
      {totalItems > 0 ? (
        <div className="mb-6">
          <ProgressBar
            value={overallCompleted}
            max={totalItems}
            label="Overall progress"
          />
          <p className="mt-1 text-xs text-[var(--cmd-text-muted)]">
            {moduleCompletedCount} of {modules.length} modules · {watchedCount} of {HUB_VIDEO_IDS.length} WorkSafe videos
          </p>
        </div>
      ) : null}

      <TrainingNextUpCard action={nextUpAction} />

      <div className="grid gap-8">
        <section ref={videoSectionRef} aria-labelledby="whs-videos-heading" className="grid gap-3">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] px-4 py-3 text-left"
            onClick={() => setVideosExpanded((open) => !open)}
            aria-expanded={videosExpanded}
            aria-controls="whs-videos-panel"
          >
            <div className="min-w-0">
              <h2 id="whs-videos-heading" className="text-base font-semibold text-[var(--cmd-text)]">
                WHS Induction — WorkSafe videos
              </h2>
              <p className="mt-0.5 text-sm text-[var(--cmd-text-muted)]">
                {watchedCount === HUB_VIDEO_IDS.length ? (
                  <span className="text-[var(--cmd-live)]">All WorkSafe videos complete</span>
                ) : (
                  <>
                    {watchedCount}/{HUB_VIDEO_IDS.length} watched · ~{totalVideoMinutes} min total
                  </>
                )}
              </p>
            </div>
            <span
              className={`shrink-0 transition-transform ${videosExpanded ? 'rotate-90' : ''}`}
              aria-hidden="true"
            >
              <IconChevronRight size="sm" variant="default" />
            </span>
          </button>

          {videosExpanded ? (
            <div id="whs-videos-panel" className="grid gap-4">
              <TrainingHubMediaSections />
            </div>
          ) : null}
        </section>

        <section aria-labelledby="training-modules-heading" className="grid gap-4">
          <div>
            <h2 id="training-modules-heading" className="text-base font-semibold text-[var(--cmd-text)]">
              Training modules
            </h2>
            <p className="mt-0.5 text-sm text-[var(--cmd-text-muted)]">
              {moduleCompletedCount} of {modules.length} complete
            </p>
          </div>

          {modules.map((mod) => (
            <TrainingModuleCard
              key={mod.moduleId}
              moduleId={mod.moduleId}
              slug={mod.slug}
              title={mod.title}
              summary={mod.summary}
              readMinutes={mod.readMinutes}
              done={mod.done}
              stale={mod.stale}
              detailSegment={detailSegment}
              moduleType={moduleType}
            />
          ))}

          {modules.length === 0 ? (
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              icon={
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            />
          ) : null}
        </section>
      </div>
    </>
  )
}
