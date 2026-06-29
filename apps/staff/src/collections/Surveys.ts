import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '@/access/roles'
import { maybeAutoSubmitOnboardingAssignment } from '@/lib/onboarding/submit-for-review'
import { relIdNumber } from '@/lib/payload-relations'

export const SurveyTemplates: CollectionConfig = {
  slug: 'survey-templates',
  labels: {
    plural: 'Survey Templates',
    singular: 'Survey Template',
  },
  admin: {
    group: 'Surveys',
    useAsTitle: 'title',
    description: 'Reusable survey forms and question definitions',
  },
  access: {
    create: adminOnly,
    read: authenticated,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        description: 'Stable identifier e.g. session-capture-v2-live',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'formKind',
      type: 'select',
      defaultValue: 'general',
      options: [
        { label: 'General survey', value: 'general' },
        { label: 'Session capture', value: 'session_capture' },
      ],
    },
    {
      name: 'captureMode',
      type: 'select',
      defaultValue: 'live',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'Practice', value: 'practice' },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.formKind === 'session_capture',
      },
    },
    {
      name: 'formVersion',
      type: 'text',
      defaultValue: '2.0',
      admin: {
        condition: (_, siblingData) => siblingData?.formKind === 'session_capture',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'fields',
      type: 'json',
      required: true,
      admin: {
        description:
          'JSON array: { id, type, label, required?, options?, step?, showWhen?, fieldRole?, scriptText? }. Types include script, section for session capture.',
      },
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
    },
    {
      name: 'piiWarning',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show participant PII warning to respondents',
    },
  ],
}

export const SurveyAssignments: CollectionConfig = {
  slug: 'survey-assignments',
  labels: {
    plural: 'Survey Assignments',
    singular: 'Survey Assignment',
  },
  admin: {
    group: 'Surveys',
    useAsTitle: 'id',
    description: 'Surveys assigned to staff with due dates and status',
  },
  access: {
    create: adminOnly,
    read: ({ req }) => {
      const user = req.user
      if (!user) return false
      if (user.role === 'admin' || user.role === 'manager') return true
      return { assignee: { equals: user.id } }
    },
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'survey-templates',
      required: true,
    },
    {
      name: 'assignee',
      type: 'relationship',
      relationTo: 'staff-users',
      required: true,
    },
    {
      name: 'dueDate',
      type: 'date',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In progress', value: 'in_progress' },
        { label: 'Complete', value: 'complete' },
      ],
    },
    {
      name: 'sessionLabel',
      type: 'text',
      admin: {
        description: 'Optional label e.g. Mock Module 16 or session date',
      },
    },
    {
      name: 'timeEntry',
      type: 'relationship',
      relationTo: 'time-entries',
    },
  ],
}

export const SurveyResponses: CollectionConfig = {
  slug: 'survey-responses',
  labels: {
    plural: 'Survey Responses',
    singular: 'Survey Response',
  },
  admin: {
    group: 'Surveys',
    description: 'Submitted survey answers from staff members',
  },
  access: {
    create: authenticated,
    read: ({ req }) => {
      const user = req.user
      if (!user) return false
      if (user.role === 'admin' || user.role === 'manager') return true
      return { respondent: { equals: user.id } }
    },
    update: () => false,
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
      name: 'template',
      type: 'relationship',
      relationTo: 'survey-templates',
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
      name: 'submittedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'timeEntry',
      type: 'relationship',
      relationTo: 'time-entries',
    },
    {
      name: 'captureMode',
      type: 'select',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'Practice', value: 'practice' },
      ],
    },
    {
      name: 'piiFlags',
      type: 'json',
      admin: { readOnly: true },
    },
    {
      name: 'attestations',
      type: 'json',
    },
    {
      name: 'formVersion',
      type: 'text',
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        const userId = typeof doc.respondent === 'object' ? doc.respondent?.id : doc.respondent
        const templateId = typeof doc.template === 'object' ? doc.template?.id : doc.template
        if (!userId || !templateId) return doc

        const tasks = await req.payload.find({
          collection: 'onboarding-tasks',
          where: {
            and: [
              { user: { equals: String(userId) } },
              { type: { equals: 'survey' } },
              { referenceCollection: { equals: 'survey-templates' } },
              { referenceId: { equals: String(templateId) } },
            ],
          },
          limit: 1,
          overrideAccess: true,
          req,
        })

        const task = tasks.docs[0]
        if (task) {
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
        }
        return doc
      },
    ],
  },
}
