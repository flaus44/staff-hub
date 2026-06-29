import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '@/access/roles'
import { maybeAutoSubmitOnboardingAssignment } from '@/lib/onboarding/submit-for-review'
import { relIdNumber } from '@/lib/payload-relations'

export const TrainingModules: CollectionConfig = {
  slug: 'training-modules',
  labels: {
    plural: 'Training Modules',
    singular: 'Training Module',
  },
  admin: {
    group: 'Training',
    useAsTitle: 'title',
    defaultColumns: ['title', 'moduleType', 'sortOrder', 'updatedAt'],
    description: 'Training induction and policy & procedure modules for staff onboarding',
  },
  access: {
    create: adminOnly,
    read: authenticated,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'moduleType',
      type: 'select',
      required: true,
      defaultValue: 'training',
      options: [
        { label: 'Training', value: 'training' },
        { label: 'Policy & procedure', value: 'policy_procedure' },
      ],
      admin: {
        description: 'Training appears under Training; policy & procedure under Policies in the staff portal.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: { description: 'One-line hook shown on module card' },
    },
    {
      name: 'estimatedMinutes',
      type: 'number',
      admin: {
        description: 'Optional override for displayed duration (~N min). Auto-calculated from content blocks when empty.',
      },
    },
    {
      name: 'contentBlocks',
      type: 'json',
      admin: {
        description:
          'Structured screens: [{ id, type, title?, body?, videoUrl?, transcript?, durationMinutes?, resourceUrl?, resourceTitle?, resourceKind?, downloadable?, attribution?, checklist?, quiz?, attestationLabel? }]',
      },
    },
    {
      name: 'linkedFormVersion',
      type: 'text',
      admin: { description: 'Session Capture form version this module aligns to (e.g. 2.0)' },
    },
    {
      name: 'quizDefinition',
      type: 'json',
      admin: {
        description:
          'Optional quiz: { passScore, questions: [{ id, prompt, options: [{ id, label, correct? }] }] }',
      },
    },
    {
      name: 'requiresScenarioGate',
      type: 'checkbox',
      defaultValue: false,
      label: 'Requires stored scenario responses on completion',
    },
    {
      name: 'requiredForRoles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Staff', value: 'staff' },
        { label: 'Contractor', value: 'contractor' },
        { label: 'Manager', value: 'manager' },
      ],
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
    },
  ],
}

export const TrainingCompletions: CollectionConfig = {
  slug: 'training-completions',
  labels: {
    plural: 'Training Completions',
    singular: 'Training Completion',
  },
  admin: {
    group: 'Training',
    description: 'Staff progress and completion records for training modules',
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
      defaultValue: ({ user }) => user?.id,
    },
    {
      name: 'module',
      type: 'relationship',
      relationTo: 'training-modules',
      required: true,
    },
    {
      name: 'completedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'moduleVersion',
      type: 'number',
    },
    {
      name: 'contentHash',
      type: 'text',
    },
    {
      name: 'quizScore',
      type: 'number',
    },
    {
      name: 'attemptCount',
      type: 'number',
      defaultValue: 1,
    },
    {
      name: 'responses',
      type: 'json',
      admin: { description: 'Stored quiz scenario answers' },
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
      name: 'linkedSurveyResponseId',
      type: 'text',
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user
        const moduleId = typeof doc.module === 'object' ? doc.module?.id : doc.module
        if (!userId || !moduleId) return doc

        const tasks = await req.payload.find({
          collection: 'onboarding-tasks',
          where: {
            and: [
              { user: { equals: String(userId) } },
              { referenceCollection: { equals: 'training-modules' } },
              { referenceId: { equals: String(moduleId) } },
            ],
          },
          limit: 2,
          overrideAccess: true,
          req,
        })

        await Promise.all(
          tasks.docs.map(async (task) => {
            await req.payload.update({
              collection: 'onboarding-tasks',
              id: task.id,
              data: {
                status: 'complete',
                completedAt: new Date().toISOString(),
                completedBy: relIdNumber(userId),
              },
              overrideAccess: true,
              req,
            })
            await maybeAutoSubmitOnboardingAssignment(req.payload, {
              userId,
              assignmentId: task.assignment,
              actorId: userId,
              req,
            })
          }),
        )

        return doc
      },
    ],
  },
}
