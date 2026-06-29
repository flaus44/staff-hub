'use client'

import { useState } from 'react'

export function PortalLogoutButton({
  variant = 'sidebar',
}: {
  variant?: 'sidebar' | 'header'
}) {
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
      await fetch('/api/staff-users/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Still redirect — session may already be cleared.
    }
    window.location.assign('/login')
  }

  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="inline-flex items-center rounded-lg border border-[var(--cmd-border)] px-3 py-2 text-sm font-medium text-[var(--cmd-text-muted)] hover:bg-[var(--cmd-surface-raised)] hover:text-[var(--cmd-text)] min-h-[40px] shrink-0 disabled:opacity-50"
      >
        {loading ? 'Signing out…' : 'Log out'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="portal-shell-link w-full border-0 bg-transparent text-left disabled:opacity-50"
    >
      <svg className="h-5 w-5 text-[var(--cmd-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9m0 0l3-3m-3 3l3 3" />
      </svg>
      {loading ? 'Signing out…' : 'Log out'}
    </button>
  )
}
