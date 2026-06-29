import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/roles'

export const InviteTokens: CollectionConfig = {
  slug: 'invite-tokens',
  labels: {
    plural: 'Invite Tokens',
    singular: 'Invite Token',
  },
  admin: {
    group: 'People',
    hidden: ({ user }) => user?.role !== 'admin',
    description: 'Pending and sent portal invitation links',
  },
  access: {
    create: adminOnly,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'tokenHash',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Staff', value: 'staff' },
        { label: 'Manager', value: 'manager' },
      ],
    },
    {
      name: 'pack',
      type: 'relationship',
      relationTo: 'onboarding-packs',
    },
    {
      name: 'assignedContractIds',
      type: 'relationship',
      relationTo: 'contracts',
      hasMany: true,
    },
    {
      name: 'assignedTrainingIds',
      type: 'relationship',
      relationTo: 'training-modules',
      hasMany: true,
    },
    {
      name: 'assignedPolicyIds',
      type: 'relationship',
      relationTo: 'training-modules',
      hasMany: true,
    },
    {
      name: 'assignedSurveyIds',
      type: 'relationship',
      relationTo: 'survey-templates',
      hasMany: true,
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
      name: 'employeeNumber',
      type: 'text',
    },
    {
      name: 'employmentBasis',
      type: 'select',
      defaultValue: 'casual',
      options: [
        { label: 'Full time', value: 'full_time' },
        { label: 'Part time', value: 'part_time' },
        { label: 'Casual', value: 'casual' },
        { label: 'Fixed term', value: 'fixed_term' },
      ],
    },
    {
      name: 'manager',
      type: 'relationship',
      relationTo: 'staff-users',
    },
    {
      name: 'startDate',
      type: 'date',
    },
    {
      name: 'complianceChecks',
      type: 'json',
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
    },
    {
      name: 'usedAt',
      type: 'date',
    },
  ],
}
