import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '@/access/roles'

export const SurveyResponseDrafts: CollectionConfig = {
  slug: 'survey-response-drafts',
  labels: {
    plural: 'Survey Response Drafts',
    singular: 'Survey Response Draft',
  },
  admin: {
    group: 'Surveys',
    description: 'In-progress session captures and surveys',
  },
  access: {
    create: authenticated,
    read: ({ req }) => {
      const user = req.user
      if (!user) return false
      if (user.role === 'admin' || user.role === 'manager') return true
      return { respondent: { equals: user.id } }
    },
    update: authenticated,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'assignment',
      type: 'relationship',
      relationTo: 'survey-assignments',
      required: true,
    },
    {
      name: 'respondent',
      type: 'relationship',
      relationTo: 'staff-users',
      required: true,
      defaultValue: ({ user }) => user?.id,
    },
    {
      name: 'answers',
      type: 'json',
      required: true,
    },
    {
      name: 'currentStep',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'expiresAt',
      type: 'date',
    },
  ],
}
