import type { CollectionConfig } from 'payload'

import { adminOnly, adminOrManager } from '@/access/roles'

const employeeReadAccess: CollectionConfig['access']['read'] = ({ req }) => {
  const user = req.user
  if (!user) return false
  if (user.role === 'admin' || user.role === 'manager') return true
  return { user: { equals: user.id } }
}

export const OnboardingPacks: CollectionConfig = {
  slug: 'onboarding-packs',
  labels: {
    plural: 'Onboarding Packs',
    singular: 'Onboarding Pack',
  },
  admin: {
    group: 'People',
    useAsTitle: 'name',
    description: 'Role-based onboarding templates assigned during invite',
    defaultColumns: ['name', 'joinLink', 'portalRoles', 'jobProfile', 'version', 'active', 'updatedAt'],
  },
  access: {
    create: adminOnly,
    read: adminOrManager,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Public join link: /onboard/{slug} (pack must be active)',
      },
    },
    { name: 'description', type: 'textarea' },
    {
      name: 'joinLink',
      type: 'ui',
      label: 'Onboarding link',
      admin: {
        disableBulkEdit: true,
        components: {
          Cell: '/components/admin/PackJoinLinkCell',
          Field: '/components/admin/PackJoinLinkField',
        },
      },
    },
    {
      name: 'portalRoles',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        { label: 'Staff', value: 'staff' },
        { label: 'Manager', value: 'manager' },
      ],
    },
    {
      name: 'jobProfile',
      type: 'select',
      options: [
        { label: 'Field worker', value: 'field_worker' },
        { label: 'Office admin', value: 'office_admin' },
        { label: 'Co-design facilitator', value: 'co_design_facilitator' },
      ],
    },
    {
      name: 'employmentBasis',
      type: 'select',
      hasMany: true,
      defaultValue: ['casual'],
      options: [
        { label: 'Full time', value: 'full_time' },
        { label: 'Part time', value: 'part_time' },
        { label: 'Casual', value: 'casual' },
        { label: 'Fixed term', value: 'fixed_term' },
      ],
    },
    { name: 'contracts', type: 'relationship', relationTo: 'contracts', hasMany: true },
    { name: 'trainingModules', type: 'relationship', relationTo: 'training-modules', hasMany: true },
    { name: 'policyModules', type: 'relationship', relationTo: 'training-modules', hasMany: true },
    { name: 'surveyTemplates', type: 'relationship', relationTo: 'survey-templates', hasMany: true },
    { name: 'complianceChecks', type: 'json' },
    {
      name: 'workState',
      type: 'select',
      options: [
        { label: 'ACT', value: 'ACT' },
        { label: 'NSW', value: 'NSW' },
        { label: 'NT', value: 'NT' },
        { label: 'QLD', value: 'QLD' },
        { label: 'SA', value: 'SA' },
        { label: 'TAS', value: 'TAS' },
        { label: 'VIC', value: 'VIC' },
        { label: 'WA', value: 'WA' },
      ],
    },
    { name: 'estimatedMinutes', type: 'number', defaultValue: 20 },
    { name: 'version', type: 'number', defaultValue: 1, required: true },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}

export const OnboardingAssignments: CollectionConfig = {
  slug: 'onboarding-assignments',
  labels: {
    plural: 'Onboarding Assignments',
    singular: 'Onboarding Assignment',
  },
  admin: {
    group: 'People',
    useAsTitle: 'id',
    description: 'Per-user onboarding snapshot frozen at invite acceptance',
    defaultColumns: ['user', 'pack', 'status', 'startDate', 'submittedAt', 'reviewedAt'],
  },
  access: {
    create: adminOnly,
    read: employeeReadAccess,
    update: adminOrManager,
    delete: adminOnly,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'staff-users', required: true, unique: true },
    { name: 'pack', type: 'relationship', relationTo: 'onboarding-packs', required: true },
    { name: 'packVersion', type: 'number', required: true },
    { name: 'assignedContracts', type: 'relationship', relationTo: 'contracts', hasMany: true },
    { name: 'assignedTraining', type: 'relationship', relationTo: 'training-modules', hasMany: true },
    { name: 'assignedPolicies', type: 'relationship', relationTo: 'training-modules', hasMany: true },
    { name: 'assignedSurveys', type: 'relationship', relationTo: 'survey-templates', hasMany: true },
    { name: 'complianceChecks', type: 'json' },
    { name: 'startDate', type: 'date' },
    { name: 'manager', type: 'relationship', relationTo: 'staff-users' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'in_progress',
      options: [
        { label: 'In progress', value: 'in_progress' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Pending admin review', value: 'pending_admin_review' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    { name: 'submittedAt', type: 'date' },
    { name: 'reviewedAt', type: 'date' },
    { name: 'reviewer', type: 'relationship', relationTo: 'staff-users' },
    { name: 'reviewLockAt', type: 'date' },
    { name: 'reviewNotes', type: 'textarea' },
    { name: 'stapledSuperReviewRequired', type: 'checkbox', defaultValue: false },
    {
      name: 'xeroSyncStatus',
      type: 'select',
      defaultValue: 'not_started',
      options: [
        { label: 'Not started', value: 'not_started' },
        { label: 'Pending', value: 'pending' },
        { label: 'Synced', value: 'synced' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    { name: 'xeroSyncAt', type: 'date' },
    { name: 'xeroSyncError', type: 'textarea' },
    { name: 'onboardingTasks', type: 'relationship', relationTo: 'onboarding-tasks', hasMany: true },
    { name: 'superChoiceDueDate', type: 'date' },
    { name: 'snapshot', type: 'json' },
  ],
}

export const OnboardingTasks: CollectionConfig = {
  slug: 'onboarding-tasks',
  labels: {
    plural: 'Onboarding Tasks',
    singular: 'Onboarding Task',
  },
  admin: {
    group: 'People',
    useAsTitle: 'title',
    description: 'Materialized per-user onboarding checklist rows',
    defaultColumns: ['title', 'user', 'group', 'status', 'blocks', 'dueDate'],
  },
  access: {
    create: adminOnly,
    read: employeeReadAccess,
    update: adminOrManager,
    delete: adminOnly,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'staff-users', required: true },
    { name: 'assignment', type: 'relationship', relationTo: 'onboarding-assignments', required: true },
    { name: 'title', type: 'text', required: true },
    {
      name: 'group',
      type: 'select',
      required: true,
      options: [
        { label: 'Before you can work', value: 'before_work' },
        { label: 'Before first pay', value: 'before_pay' },
        { label: 'Compliance checks', value: 'compliance' },
        { label: 'Reference', value: 'reference' },
      ],
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Contract', value: 'contract' },
        { label: 'Training', value: 'training' },
        { label: 'Policy', value: 'policy' },
        { label: 'Survey', value: 'survey' },
        { label: 'Profile', value: 'profile' },
        { label: 'Bank details', value: 'bank' },
        { label: 'Tax setup', value: 'tax' },
        { label: 'Super choice', value: 'super' },
        { label: 'FWIS acknowledgement', value: 'fwis' },
        { label: 'Right to work', value: 'rtw' },
        { label: 'Compliance upload', value: 'compliance' },
        { label: 'Manual admin task', value: 'manual' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'To do', value: 'pending' },
        { label: 'In progress', value: 'in_progress' },
        { label: 'Awaiting review', value: 'awaiting_review' },
        { label: 'Complete', value: 'complete' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Blocked', value: 'blocked' },
      ],
    },
    {
      name: 'blocks',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Can work', value: 'canWork' },
        { label: 'Can be paid', value: 'canBePaid' },
        { label: 'Can work unsupervised', value: 'canWorkUnsupervised' },
      ],
    },
    { name: 'referenceCollection', type: 'text' },
    { name: 'referenceId', type: 'text' },
    { name: 'href', type: 'text' },
    { name: 'notes', type: 'textarea' },
    { name: 'dueDate', type: 'date' },
    { name: 'completedAt', type: 'date' },
    { name: 'completedBy', type: 'relationship', relationTo: 'staff-users' },
    { name: 'reviewedAt', type: 'date' },
    { name: 'reviewedBy', type: 'relationship', relationTo: 'staff-users' },
  ],
}

export const OnboardingDocuments: CollectionConfig = {
  slug: 'onboarding-documents',
  labels: {
    plural: 'Onboarding Documents',
    singular: 'Onboarding Document',
  },
  admin: {
    group: 'People',
    useAsTitle: 'title',
    description: 'Vault documents generated or uploaded during onboarding',
  },
  access: {
    create: adminOrManager,
    read: employeeReadAccess,
    update: adminOrManager,
    delete: adminOnly,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'staff-users', required: true },
    { name: 'assignment', type: 'relationship', relationTo: 'onboarding-assignments' },
    { name: 'task', type: 'relationship', relationTo: 'onboarding-tasks' },
    { name: 'title', type: 'text', required: true },
    {
      name: 'documentType',
      type: 'select',
      options: [
        { label: 'Signed contract', value: 'contract_signed' },
        { label: 'FWIS acknowledgement', value: 'fwis_ack' },
        { label: 'Super choice form', value: 'super_choice' },
        { label: 'Tax setup evidence', value: 'tax_setup' },
        { label: 'Compliance evidence', value: 'compliance' },
        { label: 'Payroll packet', value: 'payroll_packet' },
        { label: 'Onboarding packet', value: 'onboarding_packet' },
      ],
    },
    { name: 'media', type: 'upload', relationTo: 'media' },
    { name: 'metadata', type: 'json' },
    { name: 'issuedAt', type: 'date' },
  ],
}

export const OnboardingEvents: CollectionConfig = {
  slug: 'onboarding-events',
  labels: {
    plural: 'Onboarding Events',
    singular: 'Onboarding Event',
  },
  admin: {
    group: 'People',
    useAsTitle: 'eventType',
    description: 'Immutable audit stream for onboarding workflow transitions',
    defaultColumns: ['eventType', 'user', 'actor', 'createdAt'],
  },
  access: {
    create: adminOrManager,
    read: adminOrManager,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'staff-users', required: true },
    { name: 'assignment', type: 'relationship', relationTo: 'onboarding-assignments' },
    { name: 'task', type: 'relationship', relationTo: 'onboarding-tasks' },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      options: [
        { label: 'Pack assigned', value: 'pack_assigned' },
        { label: 'Task completed', value: 'task_completed' },
        { label: 'Contract signed', value: 'contract_signed' },
        { label: 'Training completed', value: 'training_completed' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Resubmitted', value: 'resubmitted' },
        { label: 'Override granted', value: 'override_granted' },
        { label: 'Compliance expired', value: 'compliance_expired' },
        { label: 'Payroll packet exported', value: 'payroll_packet_exported' },
        { label: 'Forms verified', value: 'forms_verified' },
        { label: 'Xero sync queued', value: 'xero_sync_queued' },
        { label: 'Xero sync completed', value: 'xero_sync_completed' },
        { label: 'Xero sync failed', value: 'xero_sync_failed' },
      ],
    },
    { name: 'actor', type: 'relationship', relationTo: 'staff-users' },
    { name: 'note', type: 'textarea' },
    { name: 'metadata', type: 'json' },
  ],
}

export const OnboardingOverrides: CollectionConfig = {
  slug: 'onboarding-overrides',
  labels: {
    plural: 'Onboarding Overrides',
    singular: 'Onboarding Override',
  },
  admin: {
    group: 'People',
    useAsTitle: 'reason',
    description: 'Temporary admin exceptions for clock-in and payroll gates',
    defaultColumns: ['user', 'allowsClockIn', 'allowsPayroll', 'expiresAt', 'grantedBy'],
  },
  access: {
    create: adminOrManager,
    read: adminOrManager,
    update: adminOrManager,
    delete: adminOnly,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'staff-users', required: true },
    { name: 'reason', type: 'textarea', required: true },
    { name: 'allowsClockIn', type: 'checkbox', defaultValue: false },
    { name: 'allowsPayroll', type: 'checkbox', defaultValue: false },
    { name: 'expiresAt', type: 'date', required: true },
    { name: 'grantedBy', type: 'relationship', relationTo: 'staff-users', required: true },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
