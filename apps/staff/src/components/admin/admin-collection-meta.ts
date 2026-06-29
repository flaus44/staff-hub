import type { AdminIconName } from './admin-icons'

export type AdminGroup =
  | 'People'
  | 'Contracts'
  | 'Timesheets'
  | 'Training'
  | 'Surveys'
  | 'Incidents'
  | 'System'
  | 'Content'

export type CountKey =
  | 'openIncidents'
  | 'pendingSurveys'
  | 'activeShifts'
  | 'signingDrafts'
  | 'unsignedEstimate'

export interface CollectionMeta {
  slug: string
  title: string
  description: string
  group: AdminGroup
  icon: AdminIconName
  countKey?: CountKey
  href?: string
}

export const ADMIN_GROUPS: AdminGroup[] = [
  'People',
  'Contracts',
  'Timesheets',
  'Training',
  'Surveys',
  'Incidents',
  'System',
  'Content',
]

export const COLLECTION_META: CollectionMeta[] = [
  {
    slug: 'staff-users',
    title: 'Staff Users',
    description: 'Staff and contractor accounts for the portal',
    group: 'People',
    icon: 'users',
  },
  {
    slug: 'invite-tokens',
    title: 'Invite Tokens',
    description: 'Pending and sent portal invitation links',
    group: 'People',
    icon: 'invite',
  },
  {
    slug: 'onboarding-packs',
    title: 'Onboarding Packs',
    description: 'Role-based onboarding templates',
    group: 'People',
    icon: 'clipboard',
  },
  {
    slug: 'onboarding-assignments',
    title: 'Onboarding Assignments',
    description: 'Per-employee onboarding snapshots',
    group: 'People',
    icon: 'users',
  },
  {
    slug: 'onboarding-tasks',
    title: 'Onboarding Tasks',
    description: 'Materialized onboarding checklist rows',
    group: 'People',
    icon: 'check-circle',
  },
  {
    slug: 'onboarding-documents',
    title: 'Onboarding Documents',
    description: 'Onboarding document vault',
    group: 'People',
    icon: 'document',
  },
  {
    slug: 'onboarding-events',
    title: 'Onboarding Events',
    description: 'Immutable onboarding audit stream',
    group: 'People',
    icon: 'log',
  },
  {
    slug: 'onboarding-overrides',
    title: 'Onboarding Overrides',
    description: 'Temporary onboarding exceptions',
    group: 'People',
    icon: 'shield',
  },
  {
    slug: 'contracts',
    title: 'Contracts',
    description: 'Employment agreements and PDF templates for staff to sign',
    group: 'Contracts',
    icon: 'document',
  },
  {
    slug: 'contract-signatures',
    title: 'Contract Signatures',
    description: 'Completed contract signatures with audit trail',
    group: 'Contracts',
    icon: 'pen',
  },
  {
    slug: 'contract-signing-drafts',
    title: 'Signing Drafts',
    description: 'In-progress contract signings awaiting identity verification',
    group: 'Contracts',
    icon: 'pen',
    countKey: 'signingDrafts',
  },
  {
    slug: 'time-approvals',
    title: 'Time Approvals',
    description: 'Review submitted timesheets, approve in bulk, and export to Xero',
    group: 'Timesheets',
    icon: 'check-circle',
    href: '/admin/time-approvals',
  },
  {
    slug: 'time-entries',
    title: 'Time Entries',
    description: 'Raw clock-in records. For approvals, use Time Approvals.',
    group: 'Timesheets',
    icon: 'clock',
    countKey: 'activeShifts',
  },
  {
    slug: 'shift-notes',
    title: 'Shift Notes',
    description: 'Notes attached to individual time entries',
    group: 'Timesheets',
    icon: 'note',
  },
  {
    slug: 'time-entry-corrections',
    title: 'Time Entry Corrections',
    description: 'Append-only correction history for Fair Work compliance',
    group: 'Timesheets',
    icon: 'clock',
  },
  {
    slug: 'training-modules',
    title: 'Training Modules',
    description: 'Training induction and policy modules for staff onboarding',
    group: 'Training',
    icon: 'book',
  },
  {
    slug: 'training-completions',
    title: 'Training Completions',
    description: 'Staff progress and completion records for training modules',
    group: 'Training',
    icon: 'check-circle',
  },
  {
    slug: 'survey-templates',
    title: 'Survey Templates',
    description: 'Reusable survey forms and question definitions',
    group: 'Surveys',
    icon: 'clipboard',
  },
  {
    slug: 'survey-assignments',
    title: 'Survey Assignments',
    description: 'Surveys assigned to staff with due dates and status',
    group: 'Surveys',
    icon: 'clipboard',
    countKey: 'pendingSurveys',
  },
  {
    slug: 'survey-responses',
    title: 'Survey Responses',
    description: 'Submitted survey answers from staff members',
    group: 'Surveys',
    icon: 'survey',
  },
  {
    slug: 'incidents',
    title: 'Incidents',
    description: 'Staff-reported safety and compliance incidents',
    group: 'Incidents',
    icon: 'alert',
    countKey: 'openIncidents',
  },
  {
    slug: 'audit-log',
    title: 'Audit Logs',
    description: 'System-wide activity log for compliance and troubleshooting',
    group: 'System',
    icon: 'log',
  },
  {
    slug: 'media',
    title: 'Media',
    description: 'PDFs, images, and contract document uploads',
    group: 'Content',
    icon: 'image',
  },
]

export function getCollectionsByGroup(group: AdminGroup): CollectionMeta[] {
  return COLLECTION_META.filter((c) => c.group === group)
}
