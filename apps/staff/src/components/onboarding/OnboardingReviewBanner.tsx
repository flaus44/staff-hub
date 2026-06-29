import Link from 'next/link'

import type { PendingOnboardingReview } from '@/lib/onboarding/admin-review-queue'
import { Button } from '@flaus/ui-forms/Button'
import { PortalCard } from '@flaus/ui-forms/PortalCard'

interface OnboardingReviewBannerProps {
  count: number
  items: PendingOnboardingReview[]
}

export function OnboardingReviewBanner({ count, items }: OnboardingReviewBannerProps) {
  if (count <= 0) return null

  const staffLabel = count === 1 ? 'staff member' : 'staff members'
  const names = items
    .slice(0, 3)
    .map((item) => item.staffName)
    .filter(Boolean)
  const namesSuffix =
    names.length > 0
      ? ` — ${names.join(', ')}${count > names.length ? ` and ${count - names.length} more` : ''}`
      : ''

  return (
    <PortalCard variant="warn" className="mb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--cmd-text)]">
            {count} {staffLabel} awaiting onboarding confirmation
          </p>
          {namesSuffix ? (
            <p className="mt-1 text-xs text-[var(--cmd-text-muted)]">{namesSuffix.replace(/^ — /, '')}</p>
          ) : null}
        </div>
        <Link href="/onboarding/review" className="shrink-0">
          <Button className="rounded-xl text-sm">Review now</Button>
        </Link>
      </div>
    </PortalCard>
  )
}
