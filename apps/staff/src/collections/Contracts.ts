import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '@/access/roles'
import { maybeAutoSubmitOnboardingAssignment } from '@/lib/onboarding/submit-for-review'
import { relIdNumber } from '@/lib/payload-relations'

export const Contracts: CollectionConfig = {
  slug: 'contracts',
  labels: {
    plural: 'Contracts',
    singular: 'Contract',
  },
  admin: {
    group: 'Contracts',
    useAsTitle: 'title',
    description: 'Employment agreements and PDF templates for staff to sign',
    defaultColumns: ['title', 'version', 'required', 'updatedAt'],
  },
  access: {
    create: adminOnly,
    read: authenticated,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'bodyText',
      type: 'textarea',
      admin: {
        description: 'Summary shown in the portal if no PDFs are attached. Optional when document PDFs are uploaded.',
      },
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      required: true,
    },
    {
      name: 'documentPdfs',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description:
          'PDF documents merged in upload order (e.g. employment award + position description). Staff receive one combined printable PDF after signing.',
      },
    },
    {
      name: 'templatePdf',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Legacy single PDF — use Document PDFs for multiple files.',
      },
    },
    {
      name: 'applicableRoles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Staff', value: 'staff' },
        { label: 'Contractor', value: 'contractor' },
        { label: 'Manager', value: 'manager' },
      ],
    },
    {
      name: 'required',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'effectiveFrom',
      type: 'date',
    },
    {
      name: 'formFields',
      type: 'json',
      admin: {
        description:
          'JSON array of form fields staff complete before signing. Same shape as surveys: { id, type, label, required?, options?, step? }. Leave empty to use the default staff contract form.',
      },
    },
    {
      name: 'pdfFieldMap',
      type: 'json',
      admin: {
        description:
          'Maps form field ids to PDF AcroForm field names, e.g. { "firstName": "FirstName" }. Used when document PDFs contain fillable fields.',
      },
    },
    {
      name: 'useDefaultForm',
      type: 'checkbox',
      defaultValue: true,
      label: 'Use default staff contract details form',
    },
    {
      name: 'requireDiditVerification',
      type: 'checkbox',
      defaultValue: true,
      label: 'Require Didit identity verification before signing',
      admin: {
        description:
          'When enabled and Didit API keys are configured, staff must complete biometric verification between entering details and signing.',
      },
    },
  ],
}

export const ContractSignatures: CollectionConfig = {
  slug: 'contract-signatures',
  labels: {
    plural: 'Signatures',
    singular: 'Signature',
  },
  admin: {
    group: 'Contracts',
    useAsTitle: 'id',
    description: 'Completed contract signatures with audit trail',
    defaultColumns: ['contract', 'user', 'signedAt', 'consentVersion'],
  },
  access: {
    create: authenticated,
    read: ({ req }) => {
      const user = req.user
      if (!user) return false
      if (user.role === 'admin' || user.role === 'manager') return true
      return { user: { equals: user.id } }
    },
    update: () => false,
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
      name: 'contractVersion',
      type: 'number',
      required: true,
    },
    {
      name: 'documentHash',
      type: 'text',
      required: true,
    },
    {
      name: 'signatureMethod',
      type: 'select',
      options: [
        { label: 'Draw', value: 'draw' },
        { label: 'Type', value: 'type' },
      ],
    },
    {
      name: 'signatureImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'signedPdf',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'signedAt',
      type: 'date',
      required: true,
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
      name: 'consentVersion',
      type: 'text',
      required: true,
    },
    {
      name: 'consentTimestamp',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'formResponses',
      type: 'json',
      admin: {
        readOnly: true,
        description: 'Details entered by the signer before signing.',
      },
    },
    {
      name: 'signingDraft',
      type: 'relationship',
      relationTo: 'contract-signing-drafts',
      admin: { readOnly: true },
    },
    {
      name: 'diditSessionId',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'diditVerification',
      type: 'json',
      admin: { readOnly: true },
    },
    {
      name: 'onboardingConfirmedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        readOnly: true,
      },
    },
    {
      name: 'onboardingSummarySnapshot',
      type: 'json',
      admin: {
        readOnly: true,
        description: 'Onboarding summary confirmed by the employee before signing.',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user
        const contractId = typeof doc.contract === 'object' ? doc.contract?.id : doc.contract
        if (!userId || !contractId) return doc

        try {
          const taskResult = await req.payload.find({
            collection: 'onboarding-tasks',
            where: {
              and: [
                { user: { equals: String(userId) } },
                { type: { equals: 'contract' } },
                { referenceCollection: { equals: 'contracts' } },
                { referenceId: { equals: String(contractId) } },
              ],
            },
            limit: 1,
            overrideAccess: true,
            req,
          })

          const task = taskResult.docs[0]
          const staffUserId = relIdNumber(userId)
          if (task && task.status !== 'complete' && staffUserId) {
            const updateData = {
              status: 'complete' as const,
              completedAt: new Date().toISOString(),
              completedBy: staffUserId,
            }
            await req.payload.update({
              collection: 'onboarding-tasks',
              id: task.id,
              data: updateData,
              overrideAccess: true,
              req,
            })
            await req.payload.create({
              collection: 'onboarding-events',
              data: {
                user: staffUserId,
                assignment: relIdNumber(task.assignment),
                task: relIdNumber(task.id),
                actor: staffUserId,
                eventType: 'contract_signed',
              },
              overrideAccess: true,
              req,
            })
            await maybeAutoSubmitOnboardingAssignment(req.payload, {
              userId: staffUserId,
              assignmentId: task.assignment,
              actorId: staffUserId,
              req,
            })
          }
        } catch (error) {
          console.error('[contract-signatures.afterChange] onboarding task sync failed', error)
        }

        return doc
      },
    ],
  },
}
