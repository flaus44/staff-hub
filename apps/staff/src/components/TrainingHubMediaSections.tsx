'use client'

import { useCallback, useRef, useState } from 'react'

import { TrainingMediaCard } from '@/components/TrainingMediaCard'
import { TrainingVideoBlock } from '@/components/TrainingVideoBlock'
import { WHS_WORKSAFE_VIDEOS } from '@/lib/training-content-seeds'
import { extractYouTubeVideoId } from '@/lib/training-content-types'
import { HUB_VIDEO_IDS, useTrainingVideoProgress } from '@/lib/training-video-progress'

const LESSON_COMPLETE_MS = 750

function youtubeThumbnailUrl(videoUrl: string): string | undefined {
  const videoId = extractYouTubeVideoId(videoUrl)
  if (!videoId) return undefined
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

function nextUnwatchedCardId(completedVideoId: string, watchedIds: Set<string>): string | null {
  const completedIdx = WHS_WORKSAFE_VIDEOS.findIndex((video) => video.id === completedVideoId)
  const watchedWithCurrent = new Set([...watchedIds, completedVideoId])

  for (let i = completedIdx + 1; i < WHS_WORKSAFE_VIDEOS.length; i++) {
    const video = WHS_WORKSAFE_VIDEOS[i]
    if (!watchedWithCurrent.has(video.id)) return `video-${video.id}`
  }

  for (let i = 0; i < completedIdx; i++) {
    const video = WHS_WORKSAFE_VIDEOS[i]
    if (!watchedWithCurrent.has(video.id)) return `video-${video.id}`
  }

  return null
}

export function TrainingHubMediaSections() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null)
  const [showAllComplete, setShowAllComplete] = useState(false)
  const completingRef = useRef(false)
  const cardRefs = useRef<Record<string, HTMLElement | null>>({})
  const expandButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const { isWatched, markWatched, watchedIds } = useTrainingVideoProgress(HUB_VIDEO_IDS)

  const advanceToNext = useCallback((completedVideoId: string, watchedSnapshot: Set<string>) => {
    const nextCardId = nextUnwatchedCardId(completedVideoId, watchedSnapshot)

    if (nextCardId) {
      setOpenId(nextCardId)
      setShowAllComplete(false)
      requestAnimationFrame(() => {
        cardRefs.current[nextCardId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        expandButtonRefs.current[nextCardId]?.focus({ preventScroll: true })
      })
      return
    }

    setOpenId(null)
    setShowAllComplete(true)
  }, [])

  const handleLessonComplete = useCallback(
    (videoId: string) => {
      if (completingRef.current || isWatched(videoId)) return

      completingRef.current = true
      const cardId = `video-${videoId}`
      const watchedSnapshot = new Set([...watchedIds, videoId])

      markWatched(videoId)
      setJustCompletedId(cardId)

      window.setTimeout(() => {
        setJustCompletedId(null)
        advanceToNext(videoId, watchedSnapshot)
        completingRef.current = false
      }, LESSON_COMPLETE_MS)
    },
    [advanceToNext, isWatched, markWatched, watchedIds],
  )

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id))
  }

  const allWatched = watchedIds.size >= WHS_WORKSAFE_VIDEOS.length

  return (
    <>
      {showAllComplete || allWatched ? (
        <p
          className="rounded-xl border border-[var(--cmd-live)] bg-[rgba(34,197,94,0.08)] px-4 py-3 text-sm font-medium text-[var(--cmd-live)]"
          role="status"
        >
          All WorkSafe videos complete — great work. You can review any lesson below.
        </p>
      ) : null}

      {WHS_WORKSAFE_VIDEOS.map((video) => {
        const cardId = `video-${video.id}`
        const isOpen = openId === cardId
        const watched = isWatched(video.id)

        return (
          <TrainingMediaCard
            key={video.id}
            id={cardId}
            title={video.title}
            summary={video.body}
            readMinutes={video.durationMinutes ?? 3}
            kind="video"
            isOpen={isOpen}
            watched={watched}
            justCompleted={justCompletedId === cardId}
            badge="Part of WHS Induction"
            thumbnailUrl={youtubeThumbnailUrl(video.videoUrl)}
            onToggle={() => toggle(cardId)}
            expandButtonRef={(el) => {
              expandButtonRefs.current[cardId] = el
            }}
            cardRef={(el) => {
              cardRefs.current[cardId] = el
            }}
          >
            {isOpen ? (
              <TrainingVideoBlock
                videoUrl={video.videoUrl}
                transcript={video.transcript}
                title={video.title}
                watched={watched}
                onComplete={() => handleLessonComplete(video.id)}
              />
            ) : null}
          </TrainingMediaCard>
        )
      })}
    </>
  )
}
