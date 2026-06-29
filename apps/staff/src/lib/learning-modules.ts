import type { Payload, Where } from 'payload'

import {
  estimateModuleReadMinutes,
  extractQuizQuestionsFromModule,
  isCompletionStale,
  parseContentBlocksFromUnknown,
  type TrainingContentBlock,
} from '@/lib/training-content-types'
import {
  byRequiredForRoles,
  employeePortalRole,
  shouldFallbackRoleFilter,
} from '@/lib/role-content'

export const MODULE_TYPE_TRAINING = 'training' as const
export const MODULE_TYPE_POLICY = 'policy_procedure' as const

export type LearningModuleType = typeof MODULE_TYPE_TRAINING | typeof MODULE_TYPE_POLICY

/** Removed from the portal; hidden from lists and deleted from the database on seed. */
export const RETIRED_TRAINING_MODULE_SLUGS = ['difficult-conversations'] as const

export function isRetiredTrainingModuleSlug(slug: string): boolean {
  return (RETIRED_TRAINING_MODULE_SLUGS as readonly string[]).includes(slug)
}

export function learningModuleListPath(type: LearningModuleType): string {
  return type === MODULE_TYPE_POLICY ? '/policies' : '/training'
}

export function learningModuleWhere(type: LearningModuleType): Where {
  if (type === MODULE_TYPE_POLICY) {
    return { moduleType: { equals: MODULE_TYPE_POLICY } }
  }
  return {
    or: [{ moduleType: { equals: MODULE_TYPE_TRAINING } }, { moduleType: { exists: false } }],
  }
}

type TrainingModuleDoc = {
  id: string | number
  title: string
  slug: string
  content?: string | null
  summary?: string | null
  contentBlocks?: unknown
  estimatedMinutes?: number | null
  moduleType?: LearningModuleType | null
  sortOrder?: number | null
  version?: number | null
}

export type ModuleProgressInfo = {
  completed: boolean
  stale: boolean
  readMinutes: number
}

export function estimateReadMinutes(mod: {
  content?: string | null
  contentBlocks?: unknown
  estimatedMinutes?: number | null
}): number {
  const blocks = parseContentBlocksFromUnknown(mod.contentBlocks)
  return estimateModuleReadMinutes({
    content: mod.content,
    contentBlocks: blocks,
    estimatedMinutes: mod.estimatedMinutes,
  })
}

export function moduleCardDescription(mod: TrainingModuleDoc): string | undefined {
  if (mod.summary?.trim()) return mod.summary.trim()
  if (mod.content) return `${String(mod.content).slice(0, 100)}…`
  return undefined
}

export async function fetchLearningModulesForUser(
  payload: Payload,
  userId: string | number,
  moduleType: LearningModuleType,
  role: string,
) {
  const roleWhere = byRequiredForRoles(employeePortalRole(role))
  const modulesWithRoleFilter = {
    collection: 'training-modules' as const,
    where: {
      and: [learningModuleWhere(moduleType), roleWhere],
    },
    sort: 'sortOrder' as const,
    limit: 100,
  }
  const modulesWithoutRoleFilter = {
    collection: 'training-modules' as const,
    where: learningModuleWhere(moduleType),
    sort: 'sortOrder' as const,
    limit: 100,
  }
  const [modules, completions] = await Promise.all([
    payload.find(modulesWithRoleFilter).catch((error) => {
      if (!shouldFallbackRoleFilter(error, 'requiredForRoles')) throw error
      return payload.find(modulesWithoutRoleFilter)
    }),
    payload.find({
      collection: 'training-completions',
      where: { user: { equals: userId } },
      limit: 200,
      depth: 0,
    }),
  ])

  const completionByModuleId = new Map<string, { moduleVersion?: number | null }>()
  for (const c of completions.docs) {
    const modId = String(typeof c.module === 'object' ? c.module?.id : c.module)
    completionByModuleId.set(modId, c)
  }

  const completedIds = new Set<string>()
  const staleIds = new Set<string>()
  const progressByModuleId = new Map<string, ModuleProgressInfo>()

  const visibleModules = (modules.docs as TrainingModuleDoc[]).filter(
    (mod) => !isRetiredTrainingModuleSlug(String(mod.slug)),
  )

  for (const mod of visibleModules) {
    const modId = String(mod.id)
    const readMinutes = estimateReadMinutes({
      content: mod.content,
      contentBlocks: mod.contentBlocks,
      estimatedMinutes: mod.estimatedMinutes,
    })
    const completion = completionByModuleId.get(modId)
    const currentVersion = mod.version ?? 1

    if (!completion) {
      progressByModuleId.set(modId, { completed: false, stale: false, readMinutes })
      continue
    }

    const stale = isCompletionStale(currentVersion, completion.moduleVersion)
    if (stale) {
      staleIds.add(modId)
      progressByModuleId.set(modId, { completed: false, stale: true, readMinutes })
    } else {
      completedIds.add(modId)
      progressByModuleId.set(modId, { completed: true, stale: false, readMinutes })
    }
  }

  return {
    modules: visibleModules,
    completedIds,
    staleIds,
    progressByModuleId,
  }
}

export { extractQuizQuestionsFromModule, type TrainingContentBlock }
