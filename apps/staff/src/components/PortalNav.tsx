'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  IconClipboard,
  IconHome,
  IconPlus,
  PortalIcon,
} from '@/components/portal-icons'
import { PortalLogoutButton } from '@/components/PortalLogoutButton'
import {
  HOME_ACCENT,
  ONBOARDING_ACCENT,
  PORTAL_SECTIONS,
  SECTION_META,
  sectionForPathname,
  sectionHref,
  type PortalSectionId,
} from '@/lib/portal-section-meta'
import { isOnboardingPath } from '@/lib/onboarding/hub-meta'

type SidebarNavItem =
  | { key: 'home'; href: string; label: string; icon: React.ReactNode }
  | { key: 'onboarding'; href: string; label: string; icon: React.ReactNode }
  | { key: PortalSectionId; href: string; label: string; icon: React.ReactNode; sectionId: PortalSectionId }

const sidebarNavItems: SidebarNavItem[] = [
  {
    key: 'home',
    href: '/dashboard',
    label: 'Home',
    icon: <IconHome />,
  },
  {
    key: 'onboarding',
    href: '/onboarding',
    label: 'Onboarding',
    icon: <IconClipboard />,
  },
  ...PORTAL_SECTIONS.map((sectionId) => ({
    key: sectionId,
    href: sectionHref(sectionId),
    label: SECTION_META[sectionId].title,
    icon: <PortalIcon name={SECTION_META[sectionId].icon} />,
    sectionId,
  })),
]

function isSidebarItemActive(pathname: string, item: SidebarNavItem): boolean {
  if (item.key === 'home') return pathname === '/dashboard'
  if (item.key === 'onboarding') return isOnboardingPath(pathname)
  if ('sectionId' in item) return sectionForPathname(pathname) === item.sectionId
  return false
}

function sidebarLinkAccent(item: SidebarNavItem): React.CSSProperties | undefined {
  if (item.key === 'home') {
    return {
      '--tile-accent-bg': HOME_ACCENT.bg,
      '--tile-accent-fg': HOME_ACCENT.fg,
    } as React.CSSProperties
  }
  if (item.key === 'onboarding') {
    return {
      '--tile-accent-bg': ONBOARDING_ACCENT.bg,
      '--tile-accent-fg': ONBOARDING_ACCENT.fg,
    } as React.CSSProperties
  }
  if ('sectionId' in item) {
    const accent = SECTION_META[item.sectionId].accent
    return {
      '--tile-accent-bg': accent.bg,
      '--tile-accent-fg': accent.fg,
    } as React.CSSProperties
  }
  return undefined
}

function initials(name?: string, email?: string): string {
  const source = name?.trim() || email || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

function usePendingOnboardingReviewCount(userRole?: string) {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const showAdmin = userRole === 'admin' || userRole === 'manager'

  useEffect(() => {
    setMounted(true)
    if (!showAdmin) return

    fetch('/api/onboarding/review/queue', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const total = data?.totalDocs ?? data?.docs?.length ?? 0
        setCount(total)
      })
      .catch(() => undefined)
  }, [showAdmin])

  return { count, mounted, showAdmin }
}

function useIncompleteTrainingCount() {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/portal/metrics', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setCount(data?.incompleteTraining ?? 0)
      })
      .catch(() => undefined)
  }, [])

  return { count, mounted }
}

function NavCountBadge({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="absolute top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--cmd-warn)] px-1 text-[9px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}

function SidebarNavBadge({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--cmd-warn)] px-1.5 text-[10px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}

interface PortalSidebarProps {
  userName?: string
  userEmail?: string
  userRole?: string
  onboardingProgress?: { completed: number; total: number }
}

export function PortalSidebar({
  userName,
  userEmail,
  userRole,
  onboardingProgress,
}: PortalSidebarProps) {
  const pathname = usePathname() ?? ''
  const showAdmin = userRole === 'admin' || userRole === 'manager'
  const { count: pendingReviewCount, mounted: reviewBadgeMounted } =
    usePendingOnboardingReviewCount(userRole)
  const { count: incompleteTrainingCount, mounted: trainingBadgeMounted } =
    useIncompleteTrainingCount()
  const reportIncidentActive = pathname === '/incidents/new'
  const inOnboardingSection = isOnboardingPath(pathname)

  const showProgress =
    inOnboardingSection &&
    onboardingProgress &&
    onboardingProgress.total > 0
  const progressPercent = showProgress
    ? Math.round((onboardingProgress.completed / onboardingProgress.total) * 100)
    : 0

  return (
    <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-[var(--cmd-border)] bg-[var(--cmd-surface)]">
      <div className="px-5 py-5 border-b border-[var(--cmd-border)]">
        <Link href="/dashboard" className="flex items-center gap-3 no-underline">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cmd-accent)] text-white font-bold text-sm">
            F
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold leading-snug text-[var(--cmd-accent)]">Financial Literacy Australia</p>
            <p className="text-base font-semibold text-[var(--cmd-text)] leading-tight">Staff Hub</p>
          </div>
        </Link>
      </div>

      <nav className="portal-sidebar-nav flex-1 overflow-y-auto px-3 py-4" aria-label="Sidebar navigation">
        <ul className="portal-sidebar-nav__list">
          {sidebarNavItems.map((item) => {
            const active = isSidebarItemActive(pathname, item)
            const showOnboardingBadge =
              reviewBadgeMounted && item.key === 'onboarding' && pendingReviewCount > 0
            const showToolboxBadge =
              trainingBadgeMounted && item.key === 'Toolbox' && incompleteTrainingCount > 0
            const sidebarBadgeCount = showOnboardingBadge
              ? pendingReviewCount
              : showToolboxBadge
                ? incompleteTrainingCount
                : 0
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={[
                    'portal-sidebar-nav__link',
                    active ? 'portal-sidebar-nav__link--active' : '',
                  ].join(' ')}
                  style={sidebarLinkAccent(item)}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="portal-sidebar-nav__icon">{item.icon}</span>
                  <span className="portal-sidebar-nav__label">{item.label}</span>
                  {sidebarBadgeCount > 0 ? <SidebarNavBadge count={sidebarBadgeCount} /> : null}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="portal-sidebar-nav__footer">
          <Link
            href="/incidents/new"
            className={[
              'portal-sidebar-nav__footer-link',
              reportIncidentActive ? 'portal-sidebar-nav__footer-link--active' : '',
            ].join(' ')}
            aria-current={reportIncidentActive ? 'page' : undefined}
          >
            <IconPlus />
            Report incident
          </Link>
        </div>
      </nav>

      <div className="border-t border-[var(--cmd-border)] p-3 space-y-2">
        {showProgress ? (
          <Link
            href="/onboarding/setup#onboarding-checklist"
            className="onboarding-shell-progress w-full block no-underline"
            aria-label={`${onboardingProgress!.completed} of ${onboardingProgress!.total} onboarding steps complete. View checklist.`}
          >
            <span className="onboarding-shell-progress__label">
              {onboardingProgress!.completed} of {onboardingProgress!.total} complete
            </span>
            <span
              className="onboarding-shell-progress__bar"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span className="onboarding-shell-progress__fill" style={{ width: `${progressPercent}%` }} />
            </span>
          </Link>
        ) : null}
        {showAdmin && (
          <Link href="/admin" className="portal-shell-link">
            <svg className="w-5 h-5 text-[var(--cmd-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin panel
          </Link>
        )}
        <PortalLogoutButton />
        <div className="portal-user-card">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(62,106,225,0.2)] text-[var(--cmd-accent)] text-xs font-semibold">
            {initials(userName, userEmail)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--cmd-text)] truncate">{userName || 'Staff member'}</p>
            <p className="text-xs text-[var(--cmd-text-muted)] truncate">{userEmail || 'Signed in'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function backHrefFor(pathname: string): string | null {
  if (pathname === '/dashboard') return null
  if (pathname.startsWith('/hub/')) return '/dashboard'
  if (pathname === '/onboarding') return null
  if (pathname.startsWith('/onboarding/')) return '/onboarding'

  const section = sectionForPathname(pathname)
  const sectionFeatureRoots = ['/timesheets', '/surveys', '/training', '/policies', '/contracts', '/incidents'] as const

  if (pathname.startsWith('/surveys/')) return '/surveys'
  if (pathname.startsWith('/training/')) return '/training'
  if (pathname.startsWith('/policies/')) return '/policies'
  if (pathname.startsWith('/contracts/')) return '/contracts'
  if (pathname === '/incidents/new') return section ? sectionHref(section) : '/incidents'
  if (pathname.startsWith('/incidents/')) return '/incidents'

  if (section && (sectionFeatureRoots as readonly string[]).includes(pathname)) {
    return sectionHref(section)
  }

  return null
}

interface PortalHeaderProps {
  title: string
  showTitle?: boolean
  userName?: string
  headerAction?: React.ReactNode
  backHref?: string | null
  backLabel?: string
}

export function PortalHeader({
  title,
  showTitle = true,
  userName,
  headerAction,
  backHref: backHrefProp,
  backLabel = 'Back',
}: PortalHeaderProps) {
  const router = useRouter()
  const pathname = usePathname() ?? '/dashboard'
  const backFallback = backHrefProp !== undefined ? backHrefProp : backHrefFor(pathname)

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    const fallback = backFallback ?? (pathname.startsWith('/onboarding') ? '/onboarding/setup' : '/dashboard')
    router.push(fallback)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--cmd-border)] bg-[var(--cmd-surface)]/95 backdrop-blur px-4 md:px-8 py-4">
      <div className="flex items-center gap-3 max-w-6xl">
        {backFallback ? (
          <button
            type="button"
            aria-label="Go back"
            onClick={handleGoBack}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--cmd-border)] px-3 py-2 text-sm font-medium text-[var(--cmd-text-muted)] hover:bg-[var(--cmd-surface-raised)] hover:text-[var(--cmd-text)] min-h-[40px] shrink-0 no-underline"
          >
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
        ) : null}
        {showTitle ? (
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-semibold text-[var(--cmd-text)] truncate">{title}</h1>
          </div>
        ) : (
          <div className="flex-1" aria-hidden="true" />
        )}
        {userName ? (
          <p className="text-sm text-[var(--cmd-text-muted)] shrink-0 hidden lg:block">{userName}</p>
        ) : null}
        <div className="shrink-0 md:hidden">
          <PortalLogoutButton variant="header" />
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
    </header>
  )
}

export function PortalMobileNav({ userRole }: { userRole?: string }) {
  const pathname = usePathname() ?? ''
  const [mounted, setMounted] = useState(false)
  const [openIncidentCount, setOpenIncidentCount] = useState(0)
  const { count: pendingReviewCount, mounted: reviewBadgeMounted } =
    usePendingOnboardingReviewCount(userRole)
  const { count: incompleteTrainingCount, mounted: trainingBadgeMounted } =
    useIncompleteTrainingCount()

  useEffect(() => {
    setMounted(true)
    fetch('/api/incidents?limit=50', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const docs = data?.docs ?? []
        const open = docs.filter((d: { status?: string }) => d.status && d.status !== 'closed').length
        setOpenIncidentCount(open)
      })
      .catch(() => undefined)
  }, [])

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[var(--cmd-border)] bg-[var(--cmd-surface)] flex py-1 z-50 safe-area-pb"
      aria-label="Main navigation"
    >
      {sidebarNavItems.map((item) => {
        const active = isSidebarItemActive(pathname, item)
        const showSafetyBadge = mounted && item.key === 'Safety' && openIncidentCount > 0
        const showOnboardingBadge =
          reviewBadgeMounted && item.key === 'onboarding' && pendingReviewCount > 0
        const showToolboxBadge =
          trainingBadgeMounted && item.key === 'Toolbox' && incompleteTrainingCount > 0
        const badgeCount = showSafetyBadge
          ? openIncidentCount
          : showOnboardingBadge
            ? pendingReviewCount
            : showToolboxBadge
              ? incompleteTrainingCount
              : 0
        const showBadge = badgeCount > 0
        return (
          <Link
            key={item.key}
            href={item.href}
            style={sidebarLinkAccent(item)}
            className={[
              'relative flex min-w-0 flex-1 flex-col items-center px-1 py-1.5 text-[10px] min-h-[44px] justify-center rounded-xl transition-colors no-underline',
              active
                ? 'font-semibold text-[var(--tile-accent-fg)] bg-[var(--tile-accent-bg)]'
                : 'text-[var(--cmd-text-muted)]',
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            <span
              className={
                active ? 'text-[var(--tile-accent-fg)]' : 'text-[var(--cmd-text-muted)]'
              }
            >
              {item.icon}
            </span>
            <span className="max-w-full truncate">{item.label}</span>
            {showBadge ? <NavCountBadge count={badgeCount} /> : null}
          </Link>
        )
      })}
    </nav>
  )
}

export function PortalBottomNav({ userRole }: { userRole?: string }) {
  return <PortalMobileNav userRole={userRole} />
}
