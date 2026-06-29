'use client'

import React, { useState } from 'react'

function joinHref(slug: string): string {
  return `/onboard/${encodeURIComponent(slug)}`
}

function joinUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${joinHref(slug)}`
  }
  return joinHref(slug)
}

export function PackJoinLinkActions({
  slug,
  active,
  compact = false,
}: {
  slug?: string | null
  active?: boolean | null
  compact?: boolean
}) {
  const [copied, setCopied] = useState(false)

  if (!slug) {
    return <span className="pack-join-link__muted">Add a slug first</span>
  }

  if (!active) {
    return <span className="pack-join-link__muted">Activate pack to share</span>
  }

  const href = joinHref(slug)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl(slug!))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this onboarding link:', joinUrl(slug!))
    }
  }

  return (
    <div className={`pack-join-link ${compact ? 'pack-join-link--compact' : ''}`}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="pack-join-link__open"
      >
        Open onboarding
      </a>
      <button type="button" onClick={copyLink} className="pack-join-link__copy">
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}
