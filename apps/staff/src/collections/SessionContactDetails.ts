import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '@/access/roles'

function canViewContactData(req: { user?: { role?: string; contactDataViewer?: boolean } | null }) {
  const user = req.user
  if (!user) return false
  if (user.role === 'admin') return true
  if (user.contactDataViewer) return true
  return false
}

export const SessionContactDetails: CollectionConfig = {
  slug: 'session-contact-details',
  labels: {
    plural: 'Session Contact Details',
    singular: 'Session Contact Detail',
  },
  admin: {
    group: 'Surveys',
    description: 'Section 8 contact PII — separated from session research capture',
  },
  access: {
    create: authenticated,
    read: ({ req }) => {
      if (canViewContactData(req)) return true
      const user = req.user
      if (!user) return false
      return { facilitator: { equals: user.id } }
    },
    update: () => false,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'sessionResponse',
      type: 'relationship',
      relationTo: 'survey-responses',
      required: true,
    },
    {
      name: 'facilitator',
      type: 'relationship',
      relationTo: 'staff-users',
      required: true,
      defaultValue: ({ user }) => user?.id,
    },
    {
      name: 'contactAnswers',
      type: 'json',
      required: true,
    },
    {
      name: 'submittedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'formVersion',
      type: 'text',
      defaultValue: '2.0',
    },
  ],
}
