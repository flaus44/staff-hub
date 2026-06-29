'use client'

import { useEffect, useMemo, useState } from 'react'

import { ActiveShiftSummary } from '@/components/ActiveShiftSummary'
import { IconBriefcase, LiveDot } from '@/components/portal-icons'
import { Button } from '@flaus/ui-forms/Button'
import { EmptyState } from '@flaus/ui-forms/EmptyState'
import { Input } from '@flaus/ui-forms/Input'
import { ListRow } from '@flaus/ui-forms/ListRow'
import { MetricBar } from '@flaus/ui-forms/MetricBar'
import { PortalCard } from '@flaus/ui-forms/PortalCard'
import { SectionHeader } from '@flaus/ui-forms/SectionHeader'
import { Select } from '@flaus/ui-forms/Select'
import { SkeletonList } from '@flaus/ui-forms/Skeleton'
import { StatusPill } from '@flaus/ui-forms/StatusPill'
import { TextArea } from '@flaus/ui-forms/TextArea'
import { isProjectTag, PROJECT_TAG_SELECT_OPTIONS } from '@/lib/project-tags'
import {
  calcShiftDuration,
  formatAuDate,
  formatAuTime,
  formatBreakMinutes,
  formatWorkedDuration,
} from '@/lib/shift-format'

type TimeEntry = {
  id: string | number
  clockIn: string
  clockOut?: string
  breakMinutes?: number
  status: string
  projectTag?: string
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'In progress',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
  }
  return labels[status] ?? status
}

function statusVariant(status: string): 'success' | 'warning' | 'info' | 'neutral' | 'danger' {
  if (status === 'approved') return 'success'
  if (status === 'active') return 'info'
  if (status === 'rejected') return 'danger'
  if (status === 'submitted') return 'warning'
  return 'neutral'
}

function formatElapsed(clockIn: string): string {
  const seconds = Math.floor((Date.now() - new Date(clockIn).getTime()) / 1000)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function timesheetErrorMessage(code: string): string {
  switch (code) {
    case 'not_found':
      return 'Could not find your active shift. Try refreshing the page.'
    case 'not_active':
      return 'This shift is no longer active — it may already be clocked out. Refreshing your timesheet.'
    case 'already_clocked_in':
      return 'You are already clocked in.'
    case 'invalid_input':
      return 'Some details were invalid. Please check and try again.'
    case 'not_started_yet':
      return 'Your start date has not arrived yet. Complete onboarding tasks in Setup.'
    case 'blocking_task_incomplete':
      return 'Complete your required onboarding tasks before clocking in.'
    case 'awaiting_approval':
      return 'HR approval is still pending. You cannot clock in yet.'
    case 'onboarding_incomplete':
      return 'Onboarding is still in progress. Complete Setup first.'
    case 'unauthorised':
      return 'Your session expired. Please sign in again.'
    default:
      return code || 'Something went wrong. Please try again.'
  }
}

function ShiftHistoryRow({ entry }: { entry: TimeEntry }) {
  const breakMins = entry.breakMinutes ?? 0
  const duration = calcShiftDuration(entry.clockIn, entry.clockOut, breakMins)
  const isActive = entry.status === 'active'

  return (
    <ListRow
      icon={<IconBriefcase />}
      primary={entry.projectTag ?? 'Shift'}
      secondary={
        <>
          {formatAuTime(entry.clockIn)}
          {entry.clockOut ? ` – ${formatAuTime(entry.clockOut)}` : ' – in progress'}
        </>
      }
      meta={
        <>
          {duration ? (
            <span className="font-medium text-slate-600">{formatWorkedDuration(duration)}</span>
          ) : isActive ? (
            <LiveDot />
          ) : null}
          <span>{formatBreakMinutes(breakMins)}</span>
        </>
      }
      trailing={<StatusPill status={statusLabel(entry.status)} variant={statusVariant(entry.status)} />}
    />
  )
}

function groupByDate(entries: TimeEntry[]): { date: string; label: string; entries: TimeEntry[] }[] {
  const groups = new Map<string, TimeEntry[]>()
  for (const entry of entries) {
    const key = entry.clockIn.slice(0, 10)
    const list = groups.get(key) ?? []
    list.push(entry)
    groups.set(key, list)
  }
  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    label: formatAuDate(items[0].clockIn),
    entries: items,
  }))
}

export function TimesheetClient() {
  const [active, setActive] = useState<TimeEntry | null>(null)
  const [history, setHistory] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState({ activitiesDone: '', achievements: '', blockers: '', freeText: '' })
  const [breakMinutes, setBreakMinutes] = useState('0')
  const [showNotes, setShowNotes] = useState(false)
  const [error, setError] = useState('')
  const [projectTag, setProjectTag] = useState('')
  const [elapsed, setElapsed] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/time-entries?limit=50&sort=-clockIn', { credentials: 'include' })
    const data = await res.json()
    const docs = data.docs ?? []
    setHistory(docs)
    setActive(docs.find((d: TimeEntry) => d.status === 'active') ?? null)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!active) {
      setElapsed('')
      return
    }
    const tick = () => setElapsed(formatElapsed(active.clockIn))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [active])

  const todayKey = new Date().toISOString().slice(0, 10)

  const weekSummary = useMemo(() => {
    const weekStart = startOfWeek(new Date())
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })
    const maxHours = 10
    return days.map((day) => {
      const dayKey = day.toISOString().slice(0, 10)
      let minutes = 0
      for (const entry of history) {
        const entryDay = entry.clockIn.slice(0, 10)
        if (entryDay !== dayKey) continue
        const dur = calcShiftDuration(
          entry.clockIn,
          entry.clockOut ?? (entry.status === 'active' ? new Date().toISOString() : undefined),
          entry.breakMinutes ?? 0,
        )
        if (dur) minutes += dur.netMinutes
      }
      const hours = minutes / 60
      return {
        label: day.toLocaleDateString('en-AU', { weekday: 'short' }),
        hours,
        isToday: dayKey === todayKey,
      }
    })
  }, [history, todayKey])

  const groupedHistory = useMemo(() => groupByDate(history), [history])

  async function clockIn() {
    setError('')
    if (!isProjectTag(projectTag)) {
      setError('Select a project before clocking in.')
      return
    }
    const res = await fetch('/api/portal/timesheets/clock-in', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectTag }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(timesheetErrorMessage(data.error || ''))
      return
    }
    await load()
  }

  async function clockOut() {
    if (!active) return
    setError('')
    const parsedBreak = Number.parseInt(breakMinutes, 10)
    const res = await fetch('/api/portal/timesheets/clock-out', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeEntryId: active.id,
        breakMinutes: Number.isFinite(parsedBreak) ? Math.max(0, parsedBreak) : 0,
        shiftNotes: notes,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      const code = data.error || ''
      setError(timesheetErrorMessage(code))
      if (code === 'not_active' || code === 'not_found') {
        setShowNotes(false)
        await load()
      }
      return
    }
    setShowNotes(false)
    setNotes({ activitiesDone: '', achievements: '', blockers: '', freeText: '' })
    setBreakMinutes('0')
    await load()
  }

  if (loading) return <SkeletonList rows={4} />

  return (
    <div className="space-y-6 max-w-2xl">
      <PortalCard variant={active ? 'success' : 'default'}>
        {active ? (
          <ActiveShiftSummary
            elapsed={elapsed}
            clockInTime={active.clockIn}
            projectTag={active.projectTag}
            formatTime={formatAuTime}
            onClockOut={showNotes ? undefined : () => setShowNotes(true)}
          />
        ) : (
          <div className="text-center py-4">
            <p className="text-5xl font-mono font-bold text-[var(--cmd-text-muted)] tabular-nums">0:00</p>
            <p className="text-slate-600 mt-2 mb-6">Ready to start your shift?</p>
            <div className="max-w-xs mx-auto mb-4 text-left">
              <Select
                id="projectTag"
                label="Project / activity"
                required
                value={projectTag}
                onChange={(e) => setProjectTag(e.target.value)}
                options={PROJECT_TAG_SELECT_OPTIONS}
              />
            </div>
            <Button
              onClick={clockIn}
              disabled={!isProjectTag(projectTag)}
              className="w-full md:w-auto text-lg py-3"
            >
              Clock in
            </Button>
          </div>
        )}
        {error && !showNotes && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </PortalCard>

      {active && showNotes && (
        <PortalCard title="End shift" description="Record your break and what you accomplished before clocking out.">
          <div className="space-y-4">
            <Input
              id="breakMinutes"
              label="Break / lunch (minutes)"
              type="number"
              min={0}
              max={480}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
              placeholder="0"
            />
            <TextArea
              id="activitiesDone"
              label="What did you do this shift?"
              required
              value={notes.activitiesDone}
              onChange={(e) => setNotes({ ...notes, activitiesDone: e.target.value })}
            />
            <TextArea
              id="achievements"
              label="Achievements"
              value={notes.achievements}
              onChange={(e) => setNotes({ ...notes, achievements: e.target.value })}
            />
            <TextArea
              id="blockers"
              label="Blockers"
              value={notes.blockers}
              onChange={(e) => setNotes({ ...notes, blockers: e.target.value })}
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={clockOut} disabled={!notes.activitiesDone.trim()}>
                Confirm clock out
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowNotes(false)}>
                Cancel
              </Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </PortalCard>
      )}

      <PortalCard title="This week">
        <MetricBar days={weekSummary} />
      </PortalCard>

      <PortalCard title="Recent shifts">
        {history.length === 0 ? (
          <EmptyState title="No shifts recorded yet" description="Clock in when you start co-design or training." />
        ) : (
          <div>
            {groupedHistory.map((group) => (
              <div key={group.date}>
                <SectionHeader>{group.label}</SectionHeader>
                {group.entries.map((entry) => (
                  <ShiftHistoryRow key={entry.id} entry={entry} />
                ))}
              </div>
            ))}
          </div>
        )}
      </PortalCard>
    </div>
  )
}
