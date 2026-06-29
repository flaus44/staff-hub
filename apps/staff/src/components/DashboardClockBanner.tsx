'use client'

import Link from 'next/link'

import { ActiveShiftSummary, useElapsedTimer } from '@/components/ActiveShiftSummary'
import { IconClock } from '@/components/portal-icons'
import { Button } from '@flaus/ui-forms/Button'
import { PortalCard } from '@flaus/ui-forms/PortalCard'
import { formatAuTime } from '@/lib/shift-format'

interface DashboardClockBannerProps {
  clockedIn: boolean
  clockInTime?: string
}

export function DashboardClockBanner({ clockedIn, clockInTime }: DashboardClockBannerProps) {
  const elapsed = useElapsedTimer(clockInTime, clockedIn)

  if (clockedIn && clockInTime) {
    return (
      <PortalCard variant="success" className="mb-8">
        <ActiveShiftSummary
          elapsed={elapsed}
          clockInTime={clockInTime}
          formatTime={formatAuTime}
          compact
          action={
            <Link href="/timesheets">
              <Button className="rounded-xl text-sm">Clock out</Button>
            </Link>
          }
        />
      </PortalCard>
    )
  }

  return (
    <PortalCard
      className="mb-8"
      icon={<IconClock />}
      title="Not clocked in"
      description="Clock in when you start co-design or training"
    >
      <Link href="/timesheets">
        <Button className="rounded-xl text-sm">Go to timesheets</Button>
      </Link>
    </PortalCard>
  )
}
