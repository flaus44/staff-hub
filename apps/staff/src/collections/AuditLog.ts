import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/roles'

export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: {
    plural: 'Audit Logs',
    singular: 'Audit Log',
  },
  admin: {
    group: 'System',
    useAsTitle: 'action',
    defaultColumns: ['action', 'resourceType', 'resourceId', 'actor', 'createdAt'],
    description: 'System-wide activity log for compliance and troubleshooting',
  },
  access: {
    create: () => true,
    read: adminOnly,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'actor',
      type: 'relationship',
      relationTo: 'staff-users',
    },
    {
      name: 'action',
      type: 'text',
      required: true,
    },
    {
      name: 'resourceType',
      type: 'text',
      required: true,
    },
    {
      name: 'resourceId',
      type: 'text',
    },
    {
      name: 'ipAddress',
      type: 'text',
    },
    {
      name: 'userAgent',
      type: 'text',
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
  timestamps: true,
}
