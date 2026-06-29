'use client'

import React, { useMemo, useState } from 'react'

import { AdminIcon, IconArrowLeft, IconSearch } from './admin-icons'

interface Shortcut {
  label: string
  href: string
  icon: 'dashboard' | 'alert' | 'log' | 'pen'
  badge?: number
  badgeTone?: 'warning' | 'critical'
}

interface AdminNavQuickLinksClientProps {
  portalUrl: string
  shortcuts: Shortcut[]
}

export default function AdminNavQuickLinksClient({ portalUrl, shortcuts }: AdminNavQuickLinksClientProps) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!normalizedQuery) return shortcuts
    return shortcuts.filter((s) => s.label.toLowerCase().includes(normalizedQuery))
  }, [shortcuts, normalizedQuery])

  return (
    <div className="staff-hub-admin-nav-quick">
      <a href={`${portalUrl}/dashboard`} className="staff-hub-admin-nav-quick__link staff-hub-admin-nav-quick__link--exit">
        <span className="staff-hub-admin-nav-quick__icon">
          <IconArrowLeft size="sm" />
        </span>
        Back to staff portal
      </a>

      <div className="staff-hub-admin-nav-quick__search-wrap">
        <span className="staff-hub-admin-nav-quick__search-icon">
          <IconSearch size="sm" />
        </span>
        <input
          type="search"
          className="staff-hub-admin-nav-quick__search"
          placeholder="Search shortcuts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search admin shortcuts"
        />
      </div>

      <div className="staff-hub-admin-nav-quick__shortcuts">
        {filtered.map((shortcut) => (
          <a
            key={shortcut.href}
            href={shortcut.href}
            className="staff-hub-admin-nav-quick__shortcut"
            data-label={shortcut.label}
          >
            <span className="staff-hub-admin-nav-quick__shortcut-icon">
              <AdminIcon name={shortcut.icon} size="sm" />
            </span>
            <span className="staff-hub-admin-nav-quick__shortcut-label">{shortcut.label}</span>
            {shortcut.badge !== undefined && shortcut.badge > 0 && (
              <span className={`admin-badge admin-badge--${shortcut.badgeTone ?? 'warning'}`}>{shortcut.badge}</span>
            )}
          </a>
        ))}
        {filtered.length === 0 && (
          <p style={{ margin: '0.35rem 0', fontSize: '0.8125rem', color: 'var(--theme-elevation-500)' }}>
            No shortcuts match your search.
          </p>
        )}
      </div>
    </div>
  )
}
