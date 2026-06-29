import type { Payload } from 'payload'

import { ensureContractDocumentBackfill, isStaffDownloadableOnboardingDocument } from '@/lib/onboarding-documents'
import { isOnboardingPageTask, isTrainingPortalTask, sortOnboardingPageTasks } from '@/lib/onboarding/task-sections'

type OnboardingTaskDoc = {
  id: string | number
  title: string
  type: string
  group: 'before_work' | 'before_pay' | 'compliance' | 'reference'
  status: string
  href?: string | null
  blocks?: string[] | null
}

export type TaskGroupKey = OnboardingTaskDoc['group']

export const TASK_GROUP_ORDER: TaskGroupKey[] = [
  'before_work',
  'before_pay',
  'compliance',
  'reference',
]

export const TASK_GROUP_LABELS: Record<TaskGroupKey, string> = {
  before_work: 'Before you can work',
  before_pay: 'Before first pay',
  compliance: 'Compliance checks',
  reference: 'Reference',
}

export type OnboardingState = {
  assignment: Record<string, unknown> | null
  tasks: OnboardingTaskDoc[]
  portalTasks: OnboardingTaskDoc[]
  trainingTasks: OnboardingTaskDoc[]
  trainingIncompleteCount: number
  documents: Record<string, unknown>[]
  completedCount: number
  totalCount: number
  progressPercent: number
  nextTask: OnboardingTaskDoc | null
}

export async function fetchOnboardingState(payload: Payload, userId: string): Promise<OnboardingState> {
  const assignmentRes = await payload.find({
    collection: 'onboarding-assignments',
    where: { user: { equals: userId } },
    sort: '-updatedAt',
    limit: 1,
    overrideAccess: true,
  })
  const assignment = (assignmentRes.docs[0] as Record<string, unknown> | undefined) ?? null

  await ensureContractDocumentBackfill(payload, {
    userId,
    assignmentId: assignment?.id ? String(assignment.id) : null,
  })

  const [tasksRes, documentsRes] = await Promise.all([
    payload.find({
      collection: 'onboarding-tasks',
      where: { user: { equals: userId } },
      sort: 'createdAt',
      limit: 500,
    }),
    payload.find({
      collection: 'onboarding-documents',
      where: { user: { equals: userId } },
      sort: '-createdAt',
      limit: 200,
    }),
  ])

  const tasks = tasksRes.docs as unknown as OnboardingTaskDoc[]
  const documents = (documentsRes.docs as unknown as Record<string, unknown>[]).filter((doc) =>
    isStaffDownloadableOnboardingDocument(doc as { documentType?: string | null; metadata?: unknown }),
  )

  const portalTasks = tasks.filter((task) => isOnboardingPageTask(task.type))
  const trainingTasks = tasks.filter((task) => isTrainingPortalTask(task.type))

  const totalCount = portalTasks.length
  const completedCount = portalTasks.filter((task) => task.status === 'complete').length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const nextTask =
    sortOnboardingPageTasks(portalTasks).find((task) =>
      ['pending', 'in_progress', 'awaiting_review', 'rejected', 'blocked'].includes(String(task.status)),
    ) ?? null

  const trainingIncompleteCount = trainingTasks.filter((task) => task.status !== 'complete').length

  return {
    assignment,
    tasks,
    portalTasks,
    trainingTasks,
    trainingIncompleteCount,
    documents,
    completedCount,
    totalCount,
    progressPercent,
    nextTask,
  }
}
