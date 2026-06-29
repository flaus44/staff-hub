'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { WHS_WORKSAFE_VIDEOS } from '@/lib/training-content-seeds'

const STORAGE_PREFIX = 'flaus-training-video-'

export const WHS_HUB_VIDEO_COUNT = WHS_WORKSAFE_VIDEOS.length
export const PSYCHOSOCIAL_VIDEO_GATE_THRESHOLD = 4

export const TRAINING_HUB_VIDEO_IDS = WHS_WORKSAFE_VIDEOS.map((video) => video.id)
/** @deprecated Use TRAINING_HUB_VIDEO_IDS */
export const HUB_VIDEO_IDS = TRAINING_HUB_VIDEO_IDS

function watchedSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const id of a) {
    if (!b.has(id)) return false
  }
  return true
}

function videoIdsKey(videoIds: string[]): string {
  return videoIds.join('\0')
}

export function trainingVideoStorageKey(videoId: string): string {
  return `${STORAGE_PREFIX}${videoId}`
}

export function isTrainingVideoWatched(videoId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(trainingVideoStorageKey(videoId)) === '1'
  } catch {
    return false
  }
}

export function markTrainingVideoWatched(videoId: string): void {
  if (typeof window === 'undefined') return
  try {
    if (localStorage.getItem(trainingVideoStorageKey(videoId)) === '1') return
    localStorage.setItem(trainingVideoStorageKey(videoId), '1')
    window.dispatchEvent(new CustomEvent('flaus-training-video-progress'))
  } catch {
    // ignore quota / private mode
  }
}

export function getTrainingVideoWatchedIds(videoIds: string[]): string[] {
  return videoIds.filter((id) => isTrainingVideoWatched(id))
}

export function countTrainingVideosWatched(videoIds: string[]): number {
  return getTrainingVideoWatchedIds(videoIds).length
}

export function getWatchedVideoCount(): number {
  return countTrainingVideosWatched(TRAINING_HUB_VIDEO_IDS)
}

export function meetsPsychosocialVideoGate(): boolean {
  return getWatchedVideoCount() >= PSYCHOSOCIAL_VIDEO_GATE_THRESHOLD
}

export function psychosocialVideoGateMessage(watchedCount: number): string {
  const remaining = Math.max(0, PSYCHOSOCIAL_VIDEO_GATE_THRESHOLD - watchedCount)
  if (remaining === 0) {
    return 'You have watched enough WorkSafe videos to continue.'
  }
  return `Watch ${remaining} more WorkSafe video${remaining === 1 ? '' : 's'} on the Training hub before continuing.`
}

export function useTrainingVideoProgress(videoIds: string[]) {
  const [watchedIds, setWatchedIds] = useState<Set<string>>(() => new Set())
  const videoIdsRef = useRef(videoIds)
  const idsKey = videoIdsKey(videoIds)

  if (videoIdsKey(videoIdsRef.current) !== idsKey) {
    videoIdsRef.current = videoIds
  }

  const refresh = useCallback(() => {
    const next = new Set(getTrainingVideoWatchedIds(videoIdsRef.current))
    setWatchedIds((prev) => (watchedSetsEqual(prev, next) ? prev : next))
  }, [idsKey])

  useEffect(() => {
    refresh()
    const onChange = () => refresh()
    window.addEventListener('flaus-training-video-progress', onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener('flaus-training-video-progress', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [refresh])

  const markWatched = useCallback((videoId: string) => {
    markTrainingVideoWatched(videoId)
    setWatchedIds((prev) => {
      if (prev.has(videoId)) return prev
      return new Set([...prev, videoId])
    })
  }, [])

  const isWatched = useCallback((videoId: string) => watchedIds.has(videoId), [watchedIds])

  return {
    watchedIds,
    watchedCount: watchedIds.size,
    isWatched,
    markWatched,
    refresh,
  }
}
