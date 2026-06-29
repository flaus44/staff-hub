'use client'

import { useEffect, useState } from 'react'

import { IconClock } from '@/components/portal-icons'
import { Button } from '@flaus/ui-forms/Button'

interface ActiveShiftSummaryProps {
  elapsed: string
  clockInTime: string
  projectTag?: string
  formatTime: (iso: string) => string
  action?: React.ReactNode
  onClockOut?: () => void
  compact?: boolean
}

export function ActiveShiftSummary({
  elapsed,
  clockInTime,
  projectTag,
  formatTime,
  action,
  onClockOut,
  compact = false,
}: ActiveShiftSummaryProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 ${compact ? '' : 'py-2'}`}>
      <div className="flex items-start gap-3 min-w-0">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(48,209,88,0.15)] text-[var(--cmd-live)]">
          <IconClock />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cmd-live)]">On shift</p>
          <p
            className={`font-mono font-bold text-[var(--cmd-text)] tabular-nums ${compact ? 'text-3xl' : 'text-4xl sm:text-5xl'} mt-0.5`}
          >
            {elapsed}
          </p>
          <p className="text-sm text-[var(--cmd-text-muted)] mt-1">
            Started {formatTime(clockInTime)}
            {projectTag ? ` · ${projectTag}` : ''}
          </p>
        </div>
      </div>
      <div className="shrink-0">
        {action ??
          (onClockOut && (
            <Button onClick={onClockOut} className="rounded-xl text-sm py-3">
              Clock out
            </Button>
          ))}
      </div>
    </div>
  )
}

export function useElapsedTimer(clockInTime: string | undefined, active: boolean) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    if (!active || !clockInTime) {
      setElapsed('')
      return
    }

    function tick() {
      const seconds = Math.floor((Date.now() - new Date(clockInTime!).getTime()) / 1000)
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = seconds % 60
      setElapsed(
        h > 0
          ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
          : `${m}:${String(s).padStart(2, '0')}`,
      )
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [active, clockInTime])

  return elapsed
}
