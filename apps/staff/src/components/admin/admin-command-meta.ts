import type { AdminIconName } from './admin-icons'
import type { AdminMetrics, MetricCountKey } from './admin-metrics'
import { getMetricCount } from './admin-metrics'

export type CommandGroup =
  | 'People'
  | 'Contracts'
  | 'Timesheets'
  | 'Training'
  | 'Surveys'
  | 'Incidents'
  | 'System'
  | 'Content'

export interface CollectionCommandMeta {
  slug: string
  title: string
  description: string
  group: CommandGroup
  icon: AdminIconName
  countKey?: MetricCountKey
  href?: string
}

export interface QuickControlMeta {
  label: string
  href: string
  icon: AdminIconName
  badgeKey?: MetricCountKey
}

export const COMMAND_GROUPS: CommandGroup[] = [
  'People',
  'Contracts',
  'Timesheets',
  'Training',
  'Surveys',
  'Incidents',
  'System',
  'Content',
]

export const QUICK_CONTROLS: QuickControlMeta[] = [
  { label: 'People', href: '/admin/collections/staff-users', icon: 'users' },
  { label: 'Onboarding', href: '/admin/collections/onboarding-assignments', icon: 'clipboard' },
  { label: 'Contracts', href: '/admin/collections/contracts', icon: 'document' },
  { label: 'Timesheets', href: '/admin/collections/time-entries', icon: 'clock', badgeKey: 'activeShifts' },
  { label: 'Training', href: '/admin/collections/training-modules', icon: 'book' },
  { label: 'Incidents', href: '/admin/collections/incidents', icon: 'alert', badgeKey: 'openIncidents' },
  { label: 'System', href: '/admin/collections/audit-log', icon: 'shield' },
]

export const COLLECTION_COMMANDS: CollectionCommandMeta[] = [
  {
    slug: 'staff-users',
    title: 'Staff Users',
    description: 'Staff and contractor accounts',
    group: 'People',
    icon: 'users',
  },
  {
    slug: 'invite-tokens',
    title: 'Invite Tokens',
    description: 'Portal invitation links',
    group: 'People',
    icon: 'invite',
  },
  {
    slug: 'onboarding-packs',
    title: 'Onboarding Packs',
    description: 'Role templates for new hires',
    group: 'People',
    icon: 'clipboard',
  },
  {
    slug: 'onboarding-assignments',
    title: 'Onboarding Assignments',
    description: 'Per-user pack snapshots',
    group: 'People',
    icon: 'users',
  },
  {
    slug: 'onboarding-tasks',
    title: 'Onboarding Tasks',
    description: 'Task-level onboarding records',
    group: 'People',
    icon: 'check-circle',
  },
  {
    slug: 'onboarding-documents',
    title: 'Onboarding Documents',
    description: 'Signed and uploaded onboarding files',
    group: 'People',
    icon: 'document',
  },
  {
    slug: 'onboarding-events',
    title: 'Onboarding Events',
    description: 'Immutable onboarding event stream',
    group: 'People',
    icon: 'log',
  },
  {
    slug: 'onboarding-overrides',
    title: 'Onboarding Overrides',
    description: 'Temporary gate exceptions',
    group: 'People',
    icon: 'shield',
  },
  {
    slug: 'contracts',
    title: 'Contracts',
    description: 'Employment agreements and PDFs',
    group: 'Contracts',
    icon: 'document',
  },
  {
    slug: 'contract-signatures',
    title: 'Signatures',
    description: 'Completed contract signatures',
    group: 'Contracts',
    icon: 'pen',
  },
  {
    slug: 'contract-signing-drafts',
    title: 'Signing Drafts',
    description: 'Awaiting identity verification',
    group: 'Contracts',
    icon: 'pen',
    countKey: 'signingDrafts',
  },
  {
    slug: 'time-approvals',
    title: 'Time Approvals',
    description: 'Review and approve submitted timesheets',
    group: 'Timesheets',
    icon: 'check-circle',
    href: '/admin/time-approvals',
  },
  {
    slug: 'time-entries',
    title: 'Time Entries',
    description: 'Raw clock-in and clock-out records',
    group: 'Timesheets',
    icon: 'clock',
    countKey: 'activeShifts',
  },
  {
    slug: 'shift-notes',
    title: 'Shift Notes',
    description: 'Notes on time entries',
    group: 'Timesheets',
    icon: 'note',
  },
  {
    slug: 'time-entry-corrections',
    title: 'Corrections',
    description: 'Fair Work compliance history',
    group: 'Timesheets',
    icon: 'clock',
  },
  {
    slug: 'training-modules',
    title: 'Training Modules',
    description: 'Induction and policy modules',
    group: 'Training',
    icon: 'book',
  },
  {
    slug: 'training-completions',
    title: 'Completions',
    description: 'Staff training progress',
    group: 'Training',
    icon: 'check-circle',
  },
  {
    slug: 'survey-templates',
    title: 'Survey Templates',
    description: 'Reusable survey forms',
    group: 'Surveys',
    icon: 'clipboard',
  },
  {
    slug: 'survey-assignments',
    title: 'Assignments',
    description: 'Surveys assigned to staff',
    group: 'Surveys',
    icon: 'clipboard',
    countKey: 'pendingSurveys',
  },
  {
    slug: 'survey-responses',
    title: 'Responses',
    description: 'Submitted survey answers',
    group: 'Surveys',
    icon: 'survey',
  },
  {
    slug: 'incidents',
    title: 'Incidents',
    description: 'Safety and compliance reports',
    group: 'Incidents',
    icon: 'alert',
    countKey: 'openIncidents',
  },
  {
    slug: 'audit-log',
    title: 'Audit Logs',
    description: 'System activity log',
    group: 'System',
    icon: 'log',
  },
  {
    slug: 'media',
    title: 'Media',
    description: 'PDFs, images, and uploads',
    group: 'Content',
    icon: 'image',
  },
]

export function getCollectionsByGroup(group: CommandGroup): CollectionCommandMeta[] {
  return COLLECTION_COMMANDS.filter((c) => c.group === group)
}

export function badgeToneForCount(key: MetricCountKey | undefined, count: number): 'live' | 'warn' | 'critical' | null {
  if (!key || count === 0) return null
  if (key === 'openIncidents') return 'critical'
  if (key === 'activeShifts') return 'live'
  return 'warn'
}

export interface TileAccent {
  bg: string
  fg: string
}

export interface SectionMeta {
  title: string
  description: string
  icon: AdminIconName
  accent: TileAccent
}

const GROUP_ACCENTS: Record<CommandGroup, TileAccent> = {
  People: { bg: 'rgba(62, 106, 225, 0.15)', fg: '#3e6ae1' },
  Contracts: { bg: 'rgba(175, 82, 222, 0.15)', fg: '#af52de' },
  Timesheets: { bg: 'rgba(45, 212, 191, 0.15)', fg: '#2dd4bf' },
  Training: { bg: 'rgba(251, 191, 36, 0.15)', fg: '#fbbf24' },
  Surveys: { bg: 'rgba(244, 114, 182, 0.15)', fg: '#f472b6' },
  Incidents: { bg: 'rgba(251, 146, 60, 0.15)', fg: '#fb923c' },
  System: { bg: 'rgba(142, 142, 147, 0.15)', fg: '#8e8e93' },
  Content: { bg: 'rgba(52, 211, 153, 0.15)', fg: '#34d399' },
}

export const SECTION_META: Record<CommandGroup, SectionMeta> = {
  People: {
    title: 'People',
    description: 'Staff accounts and invitations',
    icon: 'users',
    accent: GROUP_ACCENTS.People,
  },
  Contracts: {
    title: 'Contracts',
    description: 'Agreements and signatures',
    icon: 'document',
    accent: GROUP_ACCENTS.Contracts,
  },
  Timesheets: {
    title: 'Timesheets',
    description: 'Time entries and shift notes',
    icon: 'clock',
    accent: GROUP_ACCENTS.Timesheets,
  },
  Training: {
    title: 'Training',
    description: 'Modules and completions',
    icon: 'book',
    accent: GROUP_ACCENTS.Training,
  },
  Surveys: {
    title: 'Surveys',
    description: 'Templates, assignments, responses',
    icon: 'clipboard',
    accent: GROUP_ACCENTS.Surveys,
  },
  Incidents: {
    title: 'Incidents',
    description: 'Safety and compliance reports',
    icon: 'alert',
    accent: GROUP_ACCENTS.Incidents,
  },
  System: {
    title: 'System',
    description: 'Audit logs and configuration',
    icon: 'shield',
    accent: GROUP_ACCENTS.System,
  },
  Content: {
    title: 'Content',
    description: 'Media and uploads',
    icon: 'image',
    accent: GROUP_ACCENTS.Content,
  },
}

export function sectionHref(group: CommandGroup): string {
  return `/admin/command?group=${encodeURIComponent(group)}`
}

export function isCommandGroup(value: string | null): value is CommandGroup {
  return value != null && COMMAND_GROUPS.includes(value as CommandGroup)
}

export function dimTileAccent(accent: TileAccent): TileAccent {
  return {
    bg: accent.bg.replace(/,\s*([\d.]+)\)$/, (_, alpha) => `, ${Math.max(0.1, parseFloat(alpha) * 0.65)})`),
    fg: accent.fg,
  }
}

export const SECTION_NAV = COMMAND_GROUPS.map((group) => ({
  group,
  label: SECTION_META[group].title,
  href: sectionHref(group),
  icon: SECTION_META[group].icon,
}))

export function getSectionAttentionCount(group: CommandGroup, metrics: AdminMetrics): number {
  return getCollectionsByGroup(group).reduce((sum, col) => {
    if (!col.countKey) return sum
    return sum + getMetricCount(metrics, col.countKey)
  }, 0)
}

export function getSectionBadgeTone(
  group: CommandGroup,
  metrics: AdminMetrics,
): 'live' | 'warn' | 'critical' | null {
  let hasCritical = false
  let hasLive = false
  let hasWarn = false

  for (const col of getCollectionsByGroup(group)) {
    if (!col.countKey) continue
    const tone = badgeToneForCount(col.countKey, metrics[col.countKey])
    if (tone === 'critical') hasCritical = true
    if (tone === 'live') hasLive = true
    if (tone === 'warn') hasWarn = true
  }

  if (hasCritical) return 'critical'
  if (hasLive) return 'live'
  if (hasWarn) return 'warn'
  return null
}
