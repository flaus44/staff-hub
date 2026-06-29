import React from 'react'

import type { PortalIconName } from '@/lib/portal-section-meta'

export type PortalIconSize = 'sm' | 'md' | 'lg' | 'xl'
export type PortalIconVariant = 'default' | 'tile'

const sizes: Record<PortalIconSize, string> = { sm: '18', md: '22', lg: '26', xl: '32' }

type IconProps = { size?: PortalIconSize; variant?: PortalIconVariant }

function PortalSvg({
  children,
  size = 'md',
  variant = 'default',
}: {
  children: React.ReactNode
  size?: PortalIconSize
  variant?: PortalIconVariant
}) {
  const dim = sizes[size]
  return (
    <svg
      width={dim}
      height={dim}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={variant === 'tile' ? 2 : 1.75}
      aria-hidden
    >
      {children}
    </svg>
  )
}

export const IconHome = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.75z" />
  </PortalSvg>
)

export const IconPlus = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </PortalSvg>
)

export const IconChevronRight = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </PortalSvg>
)

export const IconChevronLeft = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </PortalSvg>
)

export const IconClock = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </PortalSvg>
)

export const IconDocument = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </PortalSvg>
)

export const IconClipboard = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </PortalSvg>
)

export const IconPlay = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </PortalSvg>
)

export const IconShield = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </PortalSvg>
)

export const IconBook = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </PortalSvg>
)

export const IconAlert = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </PortalSvg>
)

export const IconBriefcase = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </PortalSvg>
)

export const IconCheck = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </PortalSvg>
)

export const IconUpload = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 9l5-5 5 5M12 4v12" />
  </PortalSvg>
)

export const IconBank = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 10v7m4-7v7m6-7v7m4-7v7M2 20h20M12 3l9 5H3l9-5z" />
  </PortalSvg>
)

export const IconUser = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a4 4 0 100-8 4 4 0 000 8z" />
  </PortalSvg>
)

export const IconIdCard = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h7M8 15h4" />
    <circle cx="16.5" cy="11.5" r="1.5" />
  </PortalSvg>
)

export const IconLock = ({ size, variant }: IconProps) => (
  <PortalSvg size={size} variant={variant}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </PortalSvg>
)

export const LiveDot = () => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
    style={{ background: 'rgba(48, 209, 88, 0.15)', color: 'var(--cmd-live)' }}
  >
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'var(--cmd-live)' }} />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--cmd-live)' }} />
    </span>
    Live
  </span>
)

const iconMap: Record<PortalIconName, React.FC<IconProps>> = {
  clock: IconClock,
  clipboard: IconClipboard,
  document: IconDocument,
  play: IconPlay,
  shield: IconShield,
  book: IconBook,
  alert: IconAlert,
  plus: IconPlus,
  briefcase: IconBriefcase,
  check: IconCheck,
  upload: IconUpload,
  bank: IconBank,
  user: IconUser,
  'id-card': IconIdCard,
}

export function PortalIcon({
  name,
  size = 'md',
  variant = 'default',
}: {
  name: PortalIconName
  size?: PortalIconSize
  variant?: PortalIconVariant
}) {
  const Icon = iconMap[name]
  return <Icon size={size} variant={variant} />
}
