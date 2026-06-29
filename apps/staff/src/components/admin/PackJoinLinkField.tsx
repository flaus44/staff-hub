'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

import { PackJoinLinkActions } from './PackJoinLinkActions'

export default function PackJoinLinkField() {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  const active = useFormFields(([fields]) => Boolean(fields.active?.value))

  return (
    <div className="pack-join-link-field">
      <p className="pack-join-link-field__label">Onboarding link</p>
      <p className="pack-join-link-field__help">
        Share this link with new hires so they can create an account and start onboarding for this pack.
      </p>
      <PackJoinLinkActions slug={slug} active={active} />
      {slug && active ? (
        <p className="pack-join-link-field__url">{joinUrlPreview(slug)}</p>
      ) : null}
    </div>
  )
}

function joinUrlPreview(slug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/onboard/${encodeURIComponent(slug)}`
  }
  return `/onboard/${encodeURIComponent(slug)}`
}
