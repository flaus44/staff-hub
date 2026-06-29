import type { Payload, PayloadRequest } from 'payload'

import { UNIVERSAL_TRAINING_SLUGS } from '@/lib/training-gate'

function relId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}

function relIdNumber(value: unknown): number | null {
  const id = relId(value)
  if (!id) return null
  const num = Number(id)
  return Number.isFinite(num) ? num : null
}

function relIdNumbers(values: string[]): number[] {
  return values.map((value) => relIdNumber(value)).filter((value): value is number => value != null)
}

type ProvisionInviteInput = {
  invite: Record<string, unknown>
  userId: string | number
  req: PayloadRequest
}

export type ProvisionPackInput = {
  packId: string
  userId: string | number
  req: PayloadRequest
  startDate?: string | null
  manager?: string | null
  assignedContractIds?: string[]
  assignedTrainingIds?: string[]
  assignedPolicyIds?: string[]
  assignedSurveyIds?: string[]
  complianceChecks?: Record<string, boolean>
}

type MaterializedTaskInput = {
  payload: Payload
  req: PayloadRequest
  userId: string
  assignmentId: string
  title: string
  type:
    | 'contract'
    | 'training'
    | 'policy'
    | 'survey'
    | 'profile'
    | 'bank'
    | 'tax'
    | 'super'
    | 'fwis'
    | 'rtw'
    | 'compliance'
    | 'manual'
  group: 'before_work' | 'before_pay' | 'compliance' | 'reference'
  blocks?: Array<'canWork' | 'canBePaid' | 'canWorkUnsupervised'>
  referenceCollection?: string
  referenceId?: string
  href?: string
}

async function upsertOnboardingTask(input: MaterializedTaskInput): Promise<string> {
  const {
    payload,
    req,
    userId,
    assignmentId,
    title,
    type,
    group,
    blocks = [],
    referenceCollection,
    referenceId,
    href,
  } = input

  const userRel = relIdNumber(userId)
  const assignmentRel = relIdNumber(assignmentId)
  if (!userRel || !assignmentRel) {
    throw new Error('Invalid onboarding task relationship id')
  }

  const existing = await payload.find({
    collection: 'onboarding-tasks',
    where: {
      and: [
        { user: { equals: userRel } },
        { assignment: { equals: assignmentRel } },
        { type: { equals: type } },
        { referenceCollection: { equals: referenceCollection ?? '' } },
        { referenceId: { equals: referenceId ?? '' } },
      ],
    },
    limit: 1,
    overrideAccess: true,
    req,
  })

  const data = {
    user: userRel,
    assignment: assignmentRel,
    title,
    type,
    group,
    blocks,
    status: 'pending' as const,
    referenceCollection: referenceCollection ?? '',
    referenceId: referenceId ?? '',
    href,
  }

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: 'onboarding-tasks',
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
      req,
    })
    return String(updated.id)
  }

  const created = await payload.create({
    collection: 'onboarding-tasks',
    data,
    overrideAccess: true,
    req,
  })
  return String(created.id)
}

async function ensureSurveyAssignments({
  payload,
  req,
  userId,
  surveyIds,
}: {
  payload: Payload
  req: PayloadRequest
  userId: string
  surveyIds: string[]
}) {
  await Promise.all(
    surveyIds.map(async (templateId) => {
      const templateRel = relIdNumber(templateId)
      const userRel = relIdNumber(userId)
      if (!templateRel || !userRel) return

      const existing = await payload.find({
        collection: 'survey-assignments',
        where: {
          and: [{ assignee: { equals: userRel } }, { template: { equals: templateRel } }],
        },
        limit: 1,
        overrideAccess: true,
        req,
      })
      if (existing.docs[0]) return
      await payload.create({
        collection: 'survey-assignments',
        data: {
          assignee: userRel,
          template: templateRel,
          status: 'pending',
        },
        overrideAccess: true,
        req,
      })
    }),
  )
}

function addDays(source: Date, days: number): Date {
  const copy = new Date(source)
  copy.setDate(copy.getDate() + days)
  return copy
}

/** Resolve Track A universal module IDs — merged into every onboarding pack assignment. */
async function resolveUniversalTrainingModuleIds(
  payload: Payload,
  req: PayloadRequest,
): Promise<string[]> {
  const ids: string[] = []
  for (const slug of UNIVERSAL_TRAINING_SLUGS) {
    const found = await payload.find({
      collection: 'training-modules',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
      req,
    })
    const id = relId(found.docs[0]?.id)
    if (id) ids.push(id)
  }
  return ids
}

export async function provisionOnboardingFromPack({
  packId,
  userId,
  req,
  startDate: startDateInput,
  manager,
  assignedContractIds = [],
  assignedTrainingIds = [],
  assignedPolicyIds = [],
  assignedSurveyIds = [],
  complianceChecks,
}: ProvisionPackInput): Promise<{ assignmentId: string; taskIds: string[] }> {
  const payload = req.payload
  const userIdString = String(userId)

  const pack = await payload.findByID({
    collection: 'onboarding-packs',
    id: packId,
    depth: 0,
    overrideAccess: true,
    req,
  })

  const assignedContracts = [
    ...new Set(
      [
        ...(Array.isArray(pack.contracts) ? pack.contracts.map(relId) : []),
        ...assignedContractIds,
      ].filter(Boolean) as string[],
    ),
  ]
  const universalTrainingIds = await resolveUniversalTrainingModuleIds(payload, req)
  const assignedTraining = [
    ...new Set(
      [
        ...(Array.isArray(pack.trainingModules) ? pack.trainingModules.map(relId) : []),
        ...universalTrainingIds,
        ...assignedTrainingIds,
      ].filter(Boolean) as string[],
    ),
  ]
  const assignedPolicies = [
    ...new Set(
      [
        ...(Array.isArray(pack.policyModules) ? pack.policyModules.map(relId) : []),
        ...assignedPolicyIds,
      ].filter(Boolean) as string[],
    ),
  ]
  const assignedSurveys = [
    ...new Set(
      [
        ...(Array.isArray(pack.surveyTemplates) ? pack.surveyTemplates.map(relId) : []),
        ...assignedSurveyIds,
      ].filter(Boolean) as string[],
    ),
  ]

  const startDate = startDateInput ? new Date(String(startDateInput)) : null
  const superChoiceDueDate = startDate ? addDays(startDate, 28) : null

  const userRel = relIdNumber(userIdString)
  const packRel = relIdNumber(packId)
  if (!userRel || !packRel) {
    throw new Error('Invalid onboarding assignment relationship id')
  }

  const assignment = await payload.create({
    collection: 'onboarding-assignments',
    data: {
      user: userRel,
      pack: packRel,
      packVersion: Number(pack.version ?? 1),
      assignedContracts: relIdNumbers(assignedContracts),
      assignedTraining: relIdNumbers(assignedTraining),
      assignedPolicies: relIdNumbers(assignedPolicies),
      assignedSurveys: relIdNumbers(assignedSurveys),
      complianceChecks: complianceChecks ?? pack.complianceChecks ?? {},
      manager: relIdNumber(manager),
      startDate: startDate?.toISOString(),
      superChoiceDueDate: superChoiceDueDate?.toISOString(),
      status: 'in_progress',
      snapshot: {
        packName: pack.name,
        packVersion: pack.version,
        generatedAt: new Date().toISOString(),
      },
    },
    overrideAccess: true,
    req,
  })

  const assignmentId = String(assignment.id)
  const tasks: string[] = []

  for (const moduleId of assignedTraining) {
    const moduleDoc = await payload
      .findByID({
        collection: 'training-modules',
        id: moduleId,
        depth: 0,
        overrideAccess: true,
        req,
      })
      .catch(() => null)
    const trainingBlocks: Array<'canWork' | 'canBePaid' | 'canWorkUnsupervised'> = ['canWork']
    if (moduleDoc?.slug === 'codesign-practice-capture') {
      trainingBlocks.push('canWorkUnsupervised')
    }

    tasks.push(
      await upsertOnboardingTask({
        payload,
        req,
        userId: userIdString,
        assignmentId,
        title: 'Complete training module',
        type: 'training',
        group: 'before_work',
        blocks: trainingBlocks,
        referenceCollection: 'training-modules',
        referenceId: moduleId,
        href: '/training',
      }),
    )
  }

  for (const moduleId of assignedPolicies) {
    tasks.push(
      await upsertOnboardingTask({
        payload,
        req,
        userId: userIdString,
        assignmentId,
        title: 'Acknowledge policy',
        type: 'policy',
        group: 'before_work',
        blocks: ['canWork'],
        referenceCollection: 'training-modules',
        referenceId: moduleId,
        href: '/policies',
      }),
    )
  }

  for (const surveyId of assignedSurveys) {
    tasks.push(
      await upsertOnboardingTask({
        payload,
        req,
        userId: userIdString,
        assignmentId,
        title: 'Complete onboarding survey',
        type: 'survey',
        group: 'reference',
        referenceCollection: 'survey-templates',
        referenceId: surveyId,
        href: '/surveys',
      }),
    )
  }

  const standardTasks: MaterializedTaskInput[] = [
    {
      payload,
      req,
      userId: userIdString,
      assignmentId,
      title: 'Read your workplace rights',
      type: 'fwis',
      group: 'before_work',
      blocks: ['canWork'],
      href: '/onboarding/tasks/fwis',
    },
    {
      payload,
      req,
      userId: userIdString,
      assignmentId,
      title: 'Confirm right to work',
      type: 'rtw',
      group: 'before_work',
      blocks: ['canWork'],
      href: '/onboarding/tasks/rtw',
    },
    {
      payload,
      req,
      userId: userIdString,
      assignmentId,
      title: 'Complete your profile',
      type: 'profile',
      group: 'before_pay',
      blocks: ['canBePaid'],
      href: '/onboarding/tasks/profile',
    },
    {
      payload,
      req,
      userId: userIdString,
      assignmentId,
      title: 'Add your bank details',
      type: 'bank',
      group: 'before_pay',
      blocks: ['canBePaid'],
      href: '/onboarding/tasks/bank',
    },
    {
      payload,
      req,
      userId: userIdString,
      assignmentId,
      title: 'Tax declaration',
      type: 'tax',
      group: 'before_pay',
      blocks: ['canBePaid'],
      href: '/onboarding/tasks/tax',
    },
    {
      payload,
      req,
      userId: userIdString,
      assignmentId,
      title: 'Your super fund',
      type: 'super',
      group: 'before_pay',
      blocks: ['canBePaid'],
      href: '/onboarding/tasks/super',
    },
  ]

  for (const standardTask of standardTasks) {
    tasks.push(await upsertOnboardingTask(standardTask))
  }

  for (const contractId of assignedContracts) {
    tasks.push(
      await upsertOnboardingTask({
        payload,
        req,
        userId: userIdString,
        assignmentId,
        title: 'Your contract',
        type: 'contract',
        group: 'before_work',
        blocks: ['canWork'],
        referenceCollection: 'contracts',
        referenceId: contractId,
        href: `/contracts/${contractId}/sign`,
      }),
    )
  }

  await ensureSurveyAssignments({
    payload,
    req,
    userId: userIdString,
    surveyIds: assignedSurveys,
  })

  await payload.update({
    collection: 'onboarding-assignments',
    id: assignmentId,
    data: {
      onboardingTasks: relIdNumbers(tasks),
    },
    overrideAccess: true,
    req,
  })

  await payload.create({
    collection: 'onboarding-events',
    data: {
      user: userRel,
      assignment: relIdNumber(assignmentId),
      eventType: 'pack_assigned',
      actor: req.user?.id,
      metadata: {
        packId,
        packVersion: pack.version,
      },
    },
    overrideAccess: true,
    req,
  })

  return { assignmentId, taskIds: tasks }
}

export async function provisionOnboardingFromInvite({
  invite,
  userId,
  req,
}: ProvisionInviteInput): Promise<{ assignmentId: string; taskIds: string[] }> {
  const packId = relId(invite.pack)
  if (!packId) {
    throw new Error('Invite is missing onboarding pack')
  }

  return provisionOnboardingFromPack({
    packId,
    userId,
    req,
    startDate: invite.startDate ? String(invite.startDate) : null,
    manager: relId(invite.manager),
    assignedContractIds: (Array.isArray(invite.assignedContractIds)
      ? (invite.assignedContractIds as unknown[]).map(relId)
      : []
    ).filter(Boolean) as string[],
    assignedTrainingIds: (Array.isArray(invite.assignedTrainingIds)
      ? (invite.assignedTrainingIds as unknown[]).map(relId)
      : []
    ).filter(Boolean) as string[],
    assignedPolicyIds: (Array.isArray(invite.assignedPolicyIds)
      ? (invite.assignedPolicyIds as unknown[]).map(relId)
      : []
    ).filter(Boolean) as string[],
    assignedSurveyIds: (Array.isArray(invite.assignedSurveyIds)
      ? (invite.assignedSurveyIds as unknown[]).map(relId)
      : []
    ).filter(Boolean) as string[],
    complianceChecks:
      invite.complianceChecks && typeof invite.complianceChecks === 'object'
        ? (invite.complianceChecks as Record<string, boolean>)
        : undefined,
  })
}
