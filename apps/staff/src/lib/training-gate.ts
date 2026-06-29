import type { Payload } from 'payload'

import {
  CO_DESIGN_TRAINING_SLUGS,
  SESSION_CAPTURE_LIVE_SLUG,
} from '@/lib/session-capture-fields'

/** Track A — universal WHS and privacy training before live session capture. */
export const UNIVERSAL_TRAINING_SLUGS = [
  'whs-induction',
  'whs-remote-work',
  'whs-psychosocial-deep-dive',
  'whs-fatigue-and-workload',
  'whs-aggression-and-violence',
  'whs-home-ergonomics',
  'whs-working-alone',
  'whs-consultation-and-rights',
  'privacy-basics-staff',
] as const

/** Track C — policy acknowledgements before live session capture. */
export const POLICY_TRAINING_SLUGS = [
  'code-of-conduct',
  'privacy-data-handling',
  'incident-reporting-procedure',
] as const

const LIVE_CAPTURE_PREREQUISITE_SLUGS = [
  ...UNIVERSAL_TRAINING_SLUGS,
  ...POLICY_TRAINING_SLUGS,
  ...CO_DESIGN_TRAINING_SLUGS.filter((slug) => slug !== 'codesign-practice-capture'),
] as const

export type TrainingGateResult = {
  allowed: boolean
  reason?: string
  missingSlugs?: string[]
}

async function getLiveCaptureFormVersion(payload: Payload): Promise<string> {
  const liveTemplate = await payload.find({
    collection: 'survey-templates',
    where: { slug: { equals: SESSION_CAPTURE_LIVE_SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  return String(liveTemplate.docs[0]?.formVersion ?? '2.0')
}

export async function getCompletedModuleSlugs(payload: Payload, userId: string): Promise<Set<string>> {
  const liveFormVersion = await getLiveCaptureFormVersion(payload)
  const completions = await payload.find({
    collection: 'training-completions',
    where: { user: { equals: userId } },
    limit: 500,
    depth: 1,
    overrideAccess: true,
  })

  const slugs = new Set<string>()
  for (const row of completions.docs) {
    const mod = row.module
    if (mod && typeof mod === 'object' && mod.slug) {
      const linked = mod.linkedFormVersion ? String(mod.linkedFormVersion) : null
      if (linked && linked !== liveFormVersion) continue
      const currentVersion = mod.version ?? 1
      const recordedVersion = row.moduleVersion ?? 1
      if (recordedVersion < currentVersion) continue
      slugs.add(String(mod.slug))
    }
  }
  return slugs
}

export async function assertCoDesignTrainingComplete(
  payload: Payload,
  userId: string,
): Promise<TrainingGateResult> {
  const liveFormVersion = await getLiveCaptureFormVersion(payload)
  const completions = await payload.find({
    collection: 'training-completions',
    where: { user: { equals: userId } },
    limit: 500,
    depth: 1,
    overrideAccess: true,
  })

  const completed = new Set<string>()
  const staleSlugs: string[] = []

  for (const row of completions.docs) {
    const mod = row.module
    if (!mod || typeof mod !== 'object' || !mod.slug) continue
    const slug = String(mod.slug)
    const moduleVersion = mod.version ?? 1
    const completionVersion = row.moduleVersion ?? 1

    if (completionVersion < moduleVersion) {
      staleSlugs.push(slug)
      continue
    }

    const linked = mod.linkedFormVersion ? String(mod.linkedFormVersion) : null
    if (linked && linked !== liveFormVersion) {
      staleSlugs.push(slug)
      continue
    }

    completed.add(slug)
  }

  if (staleSlugs.length > 0) {
    return {
      allowed: false,
      reason: 'training_stale',
      missingSlugs: staleSlugs,
    }
  }

  const missing = LIVE_CAPTURE_PREREQUISITE_SLUGS.filter((slug) => !completed.has(slug))

  if (missing.length > 0) {
    return {
      allowed: false,
      reason: 'training_incomplete',
      missingSlugs: missing,
    }
  }

  if (!completed.has('codesign-practice-capture')) {
    return {
      allowed: false,
      reason: 'practice_capture_required',
      missingSlugs: ['codesign-practice-capture'],
    }
  }

  return { allowed: true }
}

export async function isLiveSessionCaptureTemplate(
  payload: Payload,
  templateId: string | number,
): Promise<boolean> {
  const template = await payload.findByID({
    collection: 'survey-templates',
    id: templateId,
    depth: 0,
    overrideAccess: true,
  })
  return template?.formKind === 'session_capture' && template?.captureMode === 'live'
}
