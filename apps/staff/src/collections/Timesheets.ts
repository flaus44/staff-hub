import type { CollectionConfig, PayloadRequest } from 'payload'

import { adminOnly, adminOrManager, authenticated, getDirectReportIds } from '@/access/roles'
import { firstBlockingReason, getOnboardingEligibility } from '@/lib/onboarding/eligibility'

export const TimeEntries: CollectionConfig = {
  slug: 'time-entries',
  labels: {
    plural: 'Time Entries',
    singular: 'Time Entry',
  },
  admin: {
    group: 'Timesheets',
    useAsTitle: 'id',
    defaultColumns: ['user', 'clockIn', 'clockOut', 'status', 'approvedBy', 'projectTag'],
    description: 'Raw clock-in and clock-out records. For approvals, use Time Approvals.',
  },
  access: {
    create: async ({ req }) => {
      if (!authenticated({ req })) return false
      if (!req.user) return false
      const eligibility = await getOnboardingEligibility(req.payload, String(req.user.id), 'clock-in')
      return eligibility.canWork
    },
    read: async ({ req }) => {
      const user = req.user
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'manager') {
        const reports = await getDirectReportIds(req, String(user.id))
        return {
          or: [{ user: { equals: user.id } }, { user: { in: reports } }],
        }
      }
      return { user: { equals: user.id } }
    },
    update: async ({ req }) => {
      const user = req.user
      if (!user) return false
      if (user.role === 'admin' || user.role === 'manager') return true
      return { user: { equals: user.id }, status: { in: ['active', 'submitted'] } }
    },
    delete: adminOnly,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'staff-users',
      required: true,
      defaultValue: ({ user }) => user?.id,
    },
    { name: 'clockIn', type: 'date', required: true, admin: { components: { Cell: '/components/admin/TimeEntryClockInCell' } } },
    { name: 'clockOut', type: 'date', admin: { components: { Cell: '/components/admin/TimeEntryClockOutCell' } } },
    { name: 'breakMinutes', type: 'number', defaultValue: 0 },
    { name: 'projectTag', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'staff-users',
      access: { update: adminOrManager },
    },
    { name: 'approvedAt', type: 'date', admin: { readOnly: true } },
    { name: 'approvalNote', type: 'textarea' },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        const userId = String(
          (typeof data?.user === 'string' || typeof data?.user === 'number'
            ? data.user
            : req.user?.id) ?? '',
        )
        if (!userId) {
          throw new Error('Unable to determine timesheet user for onboarding eligibility.')
        }

        const eligibility = await getOnboardingEligibility(req.payload, userId, 'clock-in')
        if (!eligibility.canWork) {
          const reason = firstBlockingReason(eligibility)
          throw new Error(reason?.message ?? 'Onboarding requirements are not complete.')
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        if (
          data?.status === 'approved' &&
          (operation === 'create' || originalDoc?.status !== 'approved')
        ) {
          data.approvedBy = req.user?.id
          data.approvedAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
}

export const ShiftNotes: CollectionConfig = {
  slug: 'shift-notes',
  labels: {
    plural: 'Shift Notes',
    singular: 'Shift Note',
  },
  admin: { group: 'Timesheets', description: 'Notes attached to individual time entries' },
  access: {
    create: authenticated,
    read: authenticated,
    update: adminOrManager,
    delete: adminOnly,
  },
  fields: [
    { name: 'timeEntry', type: 'relationship', relationTo: 'time-entries', required: true, unique: true },
    { name: 'activitiesDone', type: 'textarea', required: true },
    { name: 'achievements', type: 'textarea' },
    { name: 'blockers', type: 'textarea' },
    { name: 'freeText', type: 'textarea' },
  ],
}

export const TimeEntryCorrections: CollectionConfig = {
  slug: 'time-entry-corrections',
  labels: {
    plural: 'Time Corrections',
    singular: 'Time Correction',
  },
  admin: {
    group: 'Timesheets',
    description: 'Append-only correction history for Fair Work compliance',
  },
  access: {
    create: adminOrManager,
    read: adminOrManager,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'timeEntry', type: 'relationship', relationTo: 'time-entries', required: true },
    { name: 'correctedBy', type: 'relationship', relationTo: 'staff-users', required: true },
    { name: 'reason', type: 'textarea', required: true },
    { name: 'previousValues', type: 'json', required: true },
    { name: 'newValues', type: 'json', required: true },
  ],
}
