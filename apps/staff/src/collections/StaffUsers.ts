import type { CollectionConfig } from 'payload'

import { adminOnly, adminOrManager, authenticated } from '@/access/roles'
import { encryptBankField, maskAccountNumber } from '@/lib/bank-encryption'
import { deleteStaffUserDependents } from '@/lib/staff-user-cleanup'
import { encryptTfn, maskTfn } from '@/lib/tfn-encryption'

export const StaffUsers: CollectionConfig = {
  slug: 'staff-users',
  labels: {
    plural: 'Staff Users',
    singular: 'Staff User',
  },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000,
  },
  admin: {
    useAsTitle: 'fullName',
    group: 'People',
    description: 'Staff and contractor accounts for the portal',
  },
  access: {
    create: adminOnly,
    read: ({ req }) => {
      if (adminOnly({ req })) return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    update: ({ req }) => {
      if (adminOnly({ req })) return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    delete: adminOnly,
    admin: adminOrManager,
  },
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        await deleteStaffUserDependents(req.payload, id, req)
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation !== 'update') return doc
        if (req.context?.skipStatusSync) return doc

        const prevStatus = String(previousDoc?.status ?? '')
        const newStatus = String(doc.status ?? '')
        if (prevStatus === newStatus) return doc

        if (newStatus === 'active') {
          const onboardingStatus = String(doc.onboardingStatus ?? '')
          const userUpdates: Record<string, string> = {}

          if (!['approved', 'active'].includes(onboardingStatus)) {
            userUpdates.onboardingStatus = 'approved'
          }

          const assignments = await req.payload.find({
            collection: 'onboarding-assignments',
            where: { user: { equals: doc.id } },
            sort: '-updatedAt',
            limit: 1,
            overrideAccess: true,
            req,
          })

          const assignment = assignments.docs[0]
          const pendingAssignmentStatuses = ['in_progress', 'submitted', 'pending_admin_review']

          if (
            assignment &&
            pendingAssignmentStatuses.includes(String(assignment.status ?? ''))
          ) {
            await req.payload.update({
              collection: 'onboarding-assignments',
              id: assignment.id,
              data: {
                status: 'approved',
                reviewedAt: new Date().toISOString(),
              },
              overrideAccess: true,
              req,
            })
          }

          if (Object.keys(userUpdates).length > 0) {
            await req.payload.update({
              collection: 'staff-users',
              id: doc.id,
              data: userUpdates,
              overrideAccess: true,
              req,
              context: { ...req.context, skipStatusSync: true },
            })
          }
        } else if (newStatus === 'inactive') {
          const onboardingStatus = String(doc.onboardingStatus ?? '')
          if (onboardingStatus !== 'suspended') {
            await req.payload.update({
              collection: 'staff-users',
              id: doc.id,
              data: { onboardingStatus: 'suspended' },
              overrideAccess: true,
              req,
              context: { ...req.context, skipStatusSync: true },
            })
          }
        }

        return doc
      },
    ],
    beforeChange: [
      async ({ data }) => {
        if (!data) return data

        const bsb = typeof data.bankBsb === 'string' ? data.bankBsb.trim() : ''
        const accountNumber =
          typeof data.bankAccountNumber === 'string' ? data.bankAccountNumber.trim() : ''
        const accountName = typeof data.bankAccountName === 'string' ? data.bankAccountName.trim() : ''

        if (bsb && accountNumber && accountName) {
          data.bankEncrypted = {
            bsb: encryptBankField(bsb),
            accountNumber: encryptBankField(accountNumber),
            accountName: encryptBankField(accountName),
          }
          data.bankAccountMasked = maskAccountNumber(accountNumber)
        }

        const rawTfn = typeof data.tfn === 'string' ? data.tfn.trim() : ''
        if (rawTfn) {
          data.tfnEncrypted = encryptTfn(rawTfn)
          data.tfnMasked = maskTfn(rawTfn)
        }
        if ('tfn' in data) {
          data.tfn = undefined
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'fullName',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        beforeValidate: [
          ({ siblingData, value }) => {
            if (typeof value === 'string' && value.trim()) return value.trim()
            const first = typeof siblingData?.firstName === 'string' ? siblingData.firstName.trim() : ''
            const last = typeof siblingData?.lastName === 'string' ? siblingData.lastName.trim() : ''
            const combined = `${first} ${last}`.trim()
            return combined || (typeof siblingData?.email === 'string' ? siblingData.email : '')
          },
        ],
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'Staff', value: 'staff' },
        { label: 'Contractor', value: 'contractor' },
      ],
      access: {
        update: adminOnly,
      },
    },
    {
      name: 'employmentType',
      type: 'select',
      options: [
        { label: 'Employee', value: 'employee' },
        { label: 'Contractor', value: 'contractor' },
      ],
      defaultValue: 'employee',
    },
    {
      name: 'manager',
      type: 'relationship',
      relationTo: 'staff-users',
      admin: {
        condition: (_, siblingData) => siblingData?.role !== 'admin',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Invited', value: 'invited' },
        { label: 'Inactive', value: 'inactive' },
      ],
      access: { update: adminOnly },
      admin: {
        description:
          'Account access. Active unlocks the full staff portal. Inactive blocks portal access.',
      },
    },
    {
      name: 'onboardingStatus',
      type: 'select',
      defaultValue: 'in_progress',
      options: [
        { label: 'Invited', value: 'invited' },
        { label: 'In progress', value: 'in_progress' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Pending admin review', value: 'pending_admin_review' },
        { label: 'Approved', value: 'approved' },
        { label: 'Active', value: 'active' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Suspended', value: 'suspended' },
      ],
      admin: {
        description:
          'Employee onboarding progress. Usually set automatically via review approval; admins can override here.',
      },
      access: { update: adminOrManager },
    },
    {
      name: 'startDate',
      type: 'date',
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
      name: 'contactDataViewer',
      type: 'checkbox',
      defaultValue: false,
      label: 'Can view Section 8 session contact details (Daniel)',
      access: { update: adminOnly },
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
      name: 'profile',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'select',
          options: [
            { label: 'Mr', value: 'Mr' },
            { label: 'Mrs', value: 'Mrs' },
            { label: 'Miss', value: 'Miss' },
            { label: 'Ms', value: 'Ms' },
          ],
        },
        { name: 'dateOfBirth', type: 'date' },
        { name: 'mobile', type: 'text' },
        { name: 'addressLine1', type: 'text' },
        { name: 'addressLine2', type: 'text' },
        { name: 'suburb', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'postcode', type: 'text' },
        { name: 'otherGivenNames', type: 'text' },
        { name: 'emergencyContactName', type: 'text' },
        { name: 'emergencyContactPhone', type: 'text' },
        { name: 'emergencyContactRelationship', type: 'text' },
      ],
    },
    {
      name: 'employeeNumber',
      type: 'text',
      admin: {
        description: 'Payroll employee number used on NAT 13080 and downstream payroll systems.',
      },
    },
    {
      name: 'bankAccountName',
      type: 'text',
      admin: { description: 'Captured for onboarding form submission and encrypted in bankEncrypted.' },
    },
    {
      name: 'bankBsb',
      type: 'text',
      admin: { description: 'Captured for onboarding form submission and encrypted in bankEncrypted.' },
    },
    {
      name: 'bankAccountNumber',
      type: 'text',
      admin: { description: 'Captured for onboarding form submission and encrypted in bankEncrypted.' },
    },
    {
      name: 'bankAccountMasked',
      type: 'text',
      admin: { readOnly: true },
      access: { update: adminOnly },
    },
    {
      name: 'bankEncrypted',
      type: 'json',
      admin: { hidden: true },
      access: { read: adminOnly, update: adminOnly },
    },
    {
      name: 'tfn',
      type: 'text',
      admin: {
        description:
          'Transient entry field only. Value is encrypted into tfnEncrypted and not stored in plain text.',
      },
      access: {
        read: adminOnly,
      },
    },
    {
      name: 'tfnMasked',
      type: 'text',
      admin: { readOnly: true },
      access: {
        update: adminOnly,
      },
    },
    {
      name: 'tfnEncrypted',
      type: 'json',
      admin: { hidden: true },
      access: { read: adminOnly, update: adminOnly },
    },
    {
      name: 'taxDeclaration',
      type: 'json',
      admin: {
        description: 'Structured tax declarations captured from onboarding TaxTask.',
      },
    },
    {
      name: 'taxSetupStatus',
      type: 'select',
      defaultValue: 'not_started',
      options: [
        { label: 'Not started', value: 'not_started' },
        { label: 'Employee confirmed', value: 'employee_confirmed' },
        { label: 'Verified in Xero', value: 'verified_in_xero' },
        { label: 'Admin override', value: 'admin_override' },
      ],
    },
    {
      name: 'superChoiceData',
      type: 'json',
      admin: {
        description: 'Structured super choice details captured from onboarding SuperTask.',
      },
    },
    {
      name: 'superChoiceStatus',
      type: 'select',
      defaultValue: 'not_started',
      options: [
        { label: 'Not started', value: 'not_started' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Verified', value: 'verified' },
      ],
    },
    {
      name: 'superChoiceDueDate',
      type: 'date',
    },
    {
      name: 'superFundName',
      type: 'text',
      admin: { description: 'Superannuation fund or provider name from onboarding.' },
    },
    {
      name: 'superFundId',
      type: 'text',
      admin: { description: 'Superannuation fund ID (USI or ABN) from onboarding.' },
    },
    {
      name: 'superMemberNumber',
      type: 'text',
      admin: { description: 'Super fund member number from onboarding.' },
    },
    {
      name: 'superUseDefaultFund',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Employee elected to use the employer default super fund.' },
    },
    {
      name: 'superComplianceLetter',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Letter of compliance from the employee super fund (required when nominating an existing fund).',
      },
    },
    {
      name: 'superComplianceLetterDocument',
      type: 'relationship',
      relationTo: 'onboarding-documents',
      admin: {
        description: 'Vault document record linked to the super fund compliance letter upload.',
      },
    },
    {
      name: 'awardName',
      type: 'text',
    },
    {
      name: 'classificationLevel',
      type: 'text',
    },
    {
      name: 'baseHourlyRate',
      type: 'number',
    },
    {
      name: 'casualLoading',
      type: 'number',
    },
    {
      name: 'rtwStatus',
      type: 'select',
      defaultValue: 'not_started',
      options: [
        { label: 'Not started', value: 'not_started' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Verified', value: 'verified' },
        { label: 'rejected', value: 'rejected' },
      ],
    },
    {
      name: 'citizenshipPath',
      type: 'select',
      options: [
        { label: 'Australian citizen', value: 'australian_citizen' },
        { label: 'Permanent resident', value: 'permanent_resident' },
        { label: 'Visa holder', value: 'visa_holder' },
      ],
    },
    {
      name: 'visaSubclass',
      type: 'text',
    },
    {
      name: 'workRightsExpiry',
      type: 'date',
    },
    {
      name: 'ndisClearanceId',
      type: 'text',
    },
    {
      name: 'wwccNumber',
      type: 'text',
    },
    {
      name: 'xeroEmployeeId',
      type: 'text',
    },
    {
      name: 'xeroSyncedAt',
      type: 'date',
    },
    {
      name: 'xeroSyncStatus',
      type: 'select',
      defaultValue: 'not_synced',
      options: [
        { label: 'Not synced', value: 'not_synced' },
        { label: 'Pending', value: 'pending' },
        { label: 'Synced', value: 'synced' },
        { label: 'Error', value: 'error' },
      ],
    },
    {
      name: 'xeroSyncError',
      type: 'textarea',
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        description: 'For contractors — auto-deactivate after co-design project',
      },
    },
    {
      name: 'totpEnabled',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true },
      access: { read: adminOnly, update: adminOnly },
    },
    {
      name: 'totpSecret',
      type: 'text',
      admin: { hidden: true },
      access: { read: adminOnly, update: adminOnly },
    },
    {
      name: 'recoveryCodes',
      type: 'json',
      admin: { hidden: true },
      access: { read: adminOnly, update: adminOnly },
    },
    {
      name: 'workerScreeningExpiry',
      type: 'date',
      admin: {
        description: 'NDIS worker screening expiry (optional)',
      },
    },
  ],
}
