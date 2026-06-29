'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { extractYouTubeVideoId, isAllowedTrainingVideoUrl, resolveTrainingVideoEmbedSrc } from '@/lib/training-content-types'

type TrainingVideoBlockProps = {
  videoUrl: string
  transcript: string
  title?: string
  watched?: boolean
  onMarkWatched?: () => void
  onComplete?: () => void
}

function youtubeThumbnailUrl(videoUrl: string): string | null {
  const videoId = extractYouTubeVideoId(videoUrl)
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

function buildYouTubeEmbedSrc(videoUrl: string): string | null {
  const base = resolveTrainingVideoEmbedSrc(videoUrl)
  if (!base) return null
  if (typeof window === 'undefined') return base

  const url = new URL(base)
  url.searchParams.set('enablejsapi', '1')
  url.searchParams.set('origin', window.location.origin)
  return url.toString()
}

function isYouTubeEndedMessage(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const payload = data as { event?: string; info?: number | { playerState?: number } }
  if (payload.event === 'onStateChange' && payload.info === 0) return true
  if (
    payload.event === 'infoDelivery' &&
    typeof payload.info === 'object' &&
    payload.info?.playerState === 0
  ) {
    return true
  }
  return false
}

export function TrainingVideoBlock({
  videoUrl,
  transcript,
  title,
  watched = false,
  onMarkWatched,
  onComplete,
}: TrainingVideoBlockProps) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [playerLoaded, setPlayerLoaded] = useState(false)
  const [embedSrc, setEmbedSrc] = useState<string | null>(() => resolveTrainingVideoEmbedSrc(videoUrl))
  const endedHandledRef = useRef(false)
  const allowed = isAllowedTrainingVideoUrl(videoUrl)
  const thumbnail = youtubeThumbnailUrl(videoUrl)

  const handleComplete = useCallback(() => {
    if (watched || endedHandledRef.current) return
    endedHandledRef.current = true
    if (onComplete) {
      onComplete()
      return
    }
    onMarkWatched?.()
  }, [watched, onComplete, onMarkWatched])

  useEffect(() => {
    endedHandledRef.current = watched
  }, [watched])

  useEffect(() => {
    setEmbedSrc(buildYouTubeEmbedSrc(videoUrl))
  }, [videoUrl])

  useEffect(() => {
    if (!playerLoaded || watched) return

    function onMessage(event: MessageEvent) {
      if (event.origin !== 'https://www.youtube.com') return

      let data: unknown = event.data
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch {
          return
        }
      }

      if (isYouTubeEndedMessage(data)) {
        handleComplete()
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [playerLoaded, watched, handleComplete])

  if (!embedSrc || !allowed) {
    return (
      <div className="rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4 text-sm text-[var(--cmd-text-muted)]">
        Video unavailable — domain not on Staff Hub allowlist.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-video overflow-hidden rounded-lg border border-[var(--cmd-border)] bg-black">
        {!playerLoaded && thumbnail ? (
          <button
            type="button"
            onClick={() => setPlayerLoaded(true)}
            className="group relative h-full w-full"
            aria-label={`Play video: ${title ?? 'Training video'}`}
          >
            <img
              src={thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/40">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cmd-accent)] text-white shadow-lg">
                <span className="ml-1 text-2xl" aria-hidden>
                  ▶
                </span>
              </span>
            </span>
          </button>
        ) : (
          <iframe
            src={embedSrc}
            title={title ?? 'Training video'}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => setShowTranscript((v) => !v)}
        className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-[var(--cmd-border)] px-4 py-2 text-left text-sm font-medium text-[var(--cmd-accent)] hover:bg-[var(--cmd-surface-raised)]"
        aria-expanded={showTranscript}
      >
        <span>{showTranscript ? 'Hide transcript' : 'Show transcript (required)'}</span>
        <span aria-hidden="true">{showTranscript ? '▲' : '▼'}</span>
      </button>
      {showTranscript ? (
        <div className="rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4 text-sm leading-relaxed text-[var(--cmd-text)]">
          {transcript}
        </div>
      ) : null}
      {!watched ? (
        <button
          type="button"
          onClick={handleComplete}
          className="min-h-[44px] w-full rounded-xl bg-[var(--cmd-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Mark as watched
        </button>
      ) : (
        <p className="text-center text-sm font-medium text-[var(--cmd-live)]">Lesson complete</p>
      )}
    </div>
  )
}
