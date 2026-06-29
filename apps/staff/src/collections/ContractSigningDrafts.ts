import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '@/access/roles'

export const ContractSigningDrafts: CollectionConfig = {
  slug: 'contract-signing-drafts',
  labels: {
    plural: 'Signing Drafts',
    singular: 'Signing Draft',
  },
  admin: {
    group: 'Contracts',
    useAsTitle: 'id',
    defaultColumns: ['contract', 'user', 'verificationStatus', 'updatedAt'],
    description: 'In-progress contract signings awaiting identity verification',
  },
  access: {
    create: authenticated,
    read: ({ req }) => {
      const user = req.user
      if (!user) return false
      if (user.role === 'admin' || user.role === 'manager') return true
      return { user: { equals: user.id } }
    },
    update: authenticated,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'staff-users',
      required: true,
    },
    {
      name: 'contract',
      type: 'relationship',
      relationTo: 'contracts',
      required: true,
    },
    {
      name: 'formResponses',
      type: 'json',
      required: true,
    },
    {
      name: 'diditSessionId',
      type: 'text',
    },
    {
      name: 'verificationStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Declined', value: 'declined' },
        { label: 'Expired', value: 'expired' },
      ],
    },
    {
      name: 'diditVerification',
      type: 'json',
      admin: {
        description: 'Didit decision payload when verification completes.',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
    },
    {
      name: 'onboardingConfirmedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When the employee confirmed their onboarding summary before signing.',
      },
    },
    {
      name: 'onboardingSummarySnapshot',
      type: 'json',
      admin: {
        description: 'Frozen copy of the onboarding summary shown at confirmation.',
      },
    },
  ],
}
