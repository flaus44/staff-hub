import type { PortalMetricCountKey } from '@/lib/portal-metrics'

export type PortalSectionId = 'CoDesign' | 'Toolbox' | 'Safety'

export type PortalNavContext = 'main' | 'onboarding' | PortalSectionId

export type PortalSectionSlug = 'co-design' | 'toolbox' | 'safety'

export type PortalIconName =
  | 'clock'
  | 'clipboard'
  | 'document'
  | 'play'
  | 'shield'
  | 'book'
  | 'alert'
  | 'plus'
  | 'briefcase'
  | 'check'
  | 'upload'
  | 'bank'
  | 'user'
  | 'id-card'

export interface TileAccent {
  bg: string
  fg: string
}

export const HOME_ACCENT: TileAccent = {
  bg: 'rgba(62, 106, 225, 0.15)',
  fg: '#3e6ae1',
}

export const ONBOARDING_ACCENT: TileAccent = HOME_ACCENT

export type PortalTileBadgeTone = 'live' | 'warn' | 'critical' | 'accent'

export interface PortalFeatureMeta {
  slug: string
  title: string
  description: string
  href: string
  icon: PortalIconName
  countKey?: PortalMetricCountKey
  calloutLabel?: string
  calloutTone?: PortalTileBadgeTone
}

export interface PortalSectionMeta {
  id: PortalSectionId
  slug: PortalSectionSlug
  title: string
  description: string
  icon: PortalIconName
  accent: TileAccent
}

export function dimTileAccent(accent: TileAccent): TileAccent {
  return {
    bg: accent.bg.replace(/,\s*([\d.]+)\)$/, (_, alpha) => `, ${Math.max(0.1, parseFloat(alpha) * 0.65)})`),
    fg: accent.fg,
  }
}

export const PORTAL_SECTIONS: PortalSectionId[] = ['CoDesign', 'Toolbox', 'Safety']

const SECTION_SLUGS: Record<PortalSectionId, PortalSectionSlug> = {
  CoDesign: 'co-design',
  Toolbox: 'toolbox',
  Safety: 'safety',
}

const SLUG_TO_SECTION: Record<PortalSectionSlug, PortalSectionId> = {
  'co-design': 'CoDesign',
  toolbox: 'Toolbox',
  safety: 'Safety',
}

export const SECTION_META: Record<PortalSectionId, PortalSectionMeta> = {
  CoDesign: {
    id: 'CoDesign',
    slug: 'co-design',
    title: 'Co-design',
    description: 'Timesheets and session capture',
    icon: 'clock',
    accent: { bg: 'rgba(45, 212, 191, 0.15)', fg: '#2dd4bf' },
  },
  Toolbox: {
    id: 'Toolbox',
    slug: 'toolbox',
    title: 'Toolbox',
    description: 'Training, policies, and contracts',
    icon: 'book',
    accent: { bg: 'rgba(251, 191, 36, 0.15)', fg: '#fbbf24' },
  },
  Safety: {
    id: 'Safety',
    slug: 'safety',
    title: 'Safety',
    description: 'Incident reports and safety actions',
    icon: 'alert',
    accent: { bg: 'rgba(251, 146, 60, 0.15)', fg: '#fb923c' },
  },
}

export const PORTAL_FEATURES: PortalFeatureMeta[] = [
  {
    slug: 'timesheets',
    title: 'Timesheets',
    description: 'Clock in, track shifts, and review hours',
    href: '/timesheets',
    icon: 'clock',
  },
  {
    slug: 'surveys',
    title: 'Session capture',
    description: 'Record your co-design session in the app',
    href: '/surveys',
    icon: 'clipboard',
    countKey: 'pendingSurveys',
  },
  {
    slug: 'quick-scripts',
    title: 'Quick scripts',
    description: 'Section 7 and distress responses to read aloud',
    href: '/co-design/scripts',
    icon: 'book',
  },
  {
    slug: 'training',
    title: 'Training',
    description: 'Required induction and learning modules',
    href: '/training',
    icon: 'play',
    countKey: 'incompleteTraining',
  },
  {
    slug: 'policies',
    title: 'Policies',
    description: 'Read and acknowledge workplace policies',
    href: '/policies',
    icon: 'shield',
    countKey: 'incompletePolicies',
  },
  {
    slug: 'contracts',
    title: 'Contracts',
    description: 'Review and sign employment agreements',
    href: '/contracts',
    icon: 'document',
    countKey: 'unsignedContracts',
  },
  {
    slug: 'incidents',
    title: 'Incidents',
    description: 'View and manage incident reports',
    href: '/incidents',
    icon: 'alert',
    countKey: 'openIncidents',
  },
  {
    slug: 'report-incident',
    title: 'Report incident',
    description: 'Submit a new safety or compliance report',
    href: '/incidents/new',
    icon: 'plus',
  },
]

const FEATURES_BY_SECTION: Record<PortalSectionId, string[]> = {
  CoDesign: ['timesheets', 'surveys', 'quick-scripts'],
  Toolbox: ['training', 'policies', 'contracts'],
  Safety: ['incidents', 'report-incident'],
}

const PATH_SECTION_MAP: { prefix: string; section: PortalSectionId }[] = [
  { prefix: '/hub/co-design', section: 'CoDesign' },
  { prefix: '/timesheets', section: 'CoDesign' },
  { prefix: '/surveys', section: 'CoDesign' },
  { prefix: '/co-design', section: 'CoDesign' },
  { prefix: '/hub/toolbox', section: 'Toolbox' },
  { prefix: '/training', section: 'Toolbox' },
  { prefix: '/policies', section: 'Toolbox' },
  { prefix: '/contracts', section: 'Toolbox' },
  { prefix: '/hub/safety', section: 'Safety' },
  { prefix: '/incidents', section: 'Safety' },
]

export function sectionHref(section: PortalSectionId): string {
  return `/hub/${SECTION_SLUGS[section]}`
}

export function sectionFromSlug(slug: string): PortalSectionId | null {
  return SLUG_TO_SECTION[slug as PortalSectionSlug] ?? null
}

export function sectionForPathname(pathname: string): PortalSectionId | null {
  for (const { prefix, section } of PATH_SECTION_MAP) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return section
    }
  }
  return null
}

export function getFeaturesBySection(section: PortalSectionId): PortalFeatureMeta[] {
  const slugs = FEATURES_BY_SECTION[section]
  return PORTAL_FEATURES.filter((f) => slugs.includes(f.slug))
}

export const SECTION_NAV = PORTAL_SECTIONS.map((id) => ({
  id,
  label: SECTION_META[id].title,
  href: sectionHref(id),
  icon: SECTION_META[id].icon,
}))

export const ONBOARDING_HUB_META = {
  title: 'Onboarding',
  description: 'Contracts, payroll details, and work rights',
  icon: 'clipboard' as const,
  accent: ONBOARDING_ACCENT,
  href: '/onboarding',
}

export const ONBOARDING_HUB_FEATURES: PortalFeatureMeta[] = [
  {
    slug: 'setup',
    title: 'Your paperwork',
    description: 'Contracts, payroll details, and work rights',
    href: '/onboarding/setup',
    icon: 'clipboard',
    calloutLabel: 'Start here',
    calloutTone: 'accent',
  },
  {
    slug: 'documents',
    title: 'Documents',
    description: 'View documents issued during onboarding',
    href: '/onboarding/documents',
    icon: 'document',
  },
]

export function isOnboardingPath(pathname: string): boolean {
  return pathname === '/onboarding' || pathname.startsWith('/onboarding/')
}

export function isOnboardingHubActive(pathname: string): boolean {
  return pathname === '/onboarding'
}

export function onboardingFeatureActive(pathname: string, href: string): boolean {
  if (href === '/onboarding/setup') {
    return (
      pathname === '/onboarding/setup' ||
      pathname.startsWith('/onboarding/tasks/') ||
      pathname === '/onboarding/review' ||
      pathname.startsWith('/onboarding/review/') ||
      pathname === '/onboarding/invite' ||
      pathname.startsWith('/onboarding/invite/')
    )
  }
  if (href === '/onboarding/documents') {
    return pathname === '/onboarding/documents' || pathname.startsWith('/onboarding/documents/')
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
