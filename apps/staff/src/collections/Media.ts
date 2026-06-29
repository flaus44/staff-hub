import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '@/access/roles'

const mediaReadAccess: CollectionConfig['access']['read'] = ({ req }) => {
  const user = req.user
  if (!user) return false
  if (user.role === 'admin' || user.role === 'manager') return true
  return {
    classification: { not_equals: 'onboarding_pii' },
  }
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    plural: 'Media',
    singular: 'Media File',
  },
  admin: {
    group: 'Content',
    description: 'PDFs, images, and contract document uploads',
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    filesRequiredOnCreate: true,
  },
  access: {
    create: authenticated,
    read: mediaReadAccess,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'classification',
      type: 'select',
      defaultValue: 'general',
      options: [
        { label: 'General', value: 'general' },
        { label: 'Contract', value: 'contract' },
        { label: 'Incident', value: 'incident' },
        { label: 'Onboarding PII', value: 'onboarding_pii' },
      ],
    },
  ],
}
