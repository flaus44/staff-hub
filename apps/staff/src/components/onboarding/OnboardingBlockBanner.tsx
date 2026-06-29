import Link from 'next/link'
import React from 'react'

export function OnboardingBlockBanner({
  message,
  href,
}: {
  message: string
  href?: string
}) {
  return (
    <div className="mb-4 w-fit rounded-xl border border-[rgba(255,69,58,0.35)] border-l-4 border-l-[var(--cmd-critical)] bg-[rgba(255,69,58,0.1)] px-4 py-3 text-sm text-[var(--cmd-text)]">
      <p>
        {message}
        {href ? (
          <>
            {' '}
            <Link href={href} className="text-[var(--cmd-accent)] underline-offset-2 hover:underline">
              Continue onboarding
            </Link>
          </>
        ) : null}
      </p>
    </div>
  )
}
