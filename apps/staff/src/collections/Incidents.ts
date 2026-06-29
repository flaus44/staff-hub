import type { CollectionConfig } from 'payload'

import { adminOnly, adminOrManager, authenticated } from '@/access/roles'

export const Incidents: CollectionConfig = {
  slug: 'incidents',
  labels: {
    plural: 'Incidents',
    singular: 'Incident',
  },
  admin: {
    group: 'Incidents',
    useAsTitle: 'id',
    description: 'Staff-reported safety and compliance incidents',
    defaultColumns: ['reporter', 'category', 'severity', 'status', 'occurredAt'],
  },
  access: {
    create: authenticated,
    read: ({ req }) => {
      const user = req.user
      if (!user) return false
      if (user.role === 'admin' || user.role === 'manager') return true
      return { reporter: { equals: user.id } }
    },
    update: adminOrManager,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'reporter',
      type: 'relationship',
      relationTo: 'staff-users',
      required: true,
      defaultValue: ({ user }) => user?.id,
    },
    {
      name: 'occurredAt',
      type: 'date',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Injury', value: 'injury' },
        { label: 'Near miss', value: 'near_miss' },
        { label: 'Property damage', value: 'property' },
        { label: 'Psychosocial', value: 'psychosocial' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'witnesses',
      type: 'array',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'contact', type: 'text' },
        { name: 'role', type: 'text' },
      ],
    },
    {
      name: 'immediateActions',
      type: 'textarea',
    },
    {
      name: 'treatmentRequired',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'severity',
      type: 'select',
      defaultValue: 'low',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'submitted',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Under review', value: 'under_review' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    {
      name: 'attachments',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'piiAcknowledged',
      type: 'checkbox',
      label: 'Reporter acknowledged not to include participant NDIS numbers unless necessary',
    },
  ],
}
