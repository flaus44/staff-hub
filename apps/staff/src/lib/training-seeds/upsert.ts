import type { Payload } from 'payload'

import type { TrainingContentBlock, TrainingModuleSeed } from '@/lib/training-content-seeds'
import {
  buildCoDesignContentBlocks,
  CO_DESIGN_SUMMARIES,
  POLICY_SEEDS,
  PRIVACY_BASICS_STAFF_SEED,
  section7ContentBlocks,
  section8ContentBlocks,
  WHS_AGGRESSION_AND_VIOLENCE_SEED,
  WHS_CONSULTATION_AND_RIGHTS_SEED,
  WHS_FATIGUE_AND_WORKLOAD_SEED,
  WHS_HOME_ERGONOMICS_SEED,
  WHS_INDUCTION_SEED,
  WHS_PSYCHOSOCIAL_DEEP_DIVE_SEED,
  WHS_REMOTE_WORK_SEED,
  WHS_WORKING_ALONE_SEED,
} from '@/lib/training-content-seeds'
import { RETIRED_TRAINING_MODULE_SLUGS } from '@/lib/learning-modules'
import { CO_DESIGN_TRAINING_SLUGS } from '@/lib/session-capture-fields'
import { SECTION_7_SCRIPT } from '@/lib/survey-field'
import { TRAINING_MODULE_VERSION_MANIFEST } from '@/lib/training-module-version-manifest'
import type { TrainingQuizDefinition } from '@/lib/training-content-types'

const SESSION_CAPTURE_FORM_VERSION = '2.0'

const CO_DESIGN_MODULE_VERSIONS: Partial<Record<(typeof CO_DESIGN_TRAINING_SLUGS)[number], number>> = {
  'codesign-golden-rule': 4,
  'codesign-before-session': 4,
  'codesign-welcome-script': 4,
  'codesign-during-session': 4,
  'codesign-distress-responses': 5,
  'codesign-section-7': 5,
  'codesign-section-8': 4,
  'codesign-quotes-notes': 4,
  'codesign-privacy-basics': 4,
  'codesign-practice-capture': 4,
}

const CO_DESIGN_MODULE_SEEDS: {
  slug: (typeof CO_DESIGN_TRAINING_SLUGS)[number]
  title: string
  content: string
  requiresScenarioGate?: boolean
  linkedFormVersion?: string
  quizDefinition?: TrainingQuizDefinition
}[] = [
  {
    slug: 'codesign-golden-rule',
    title: "Golden rule — don't teach",
    content:
      "Don't teach. Let them try.\n\nSay: \"Show me what you would do.\"\n\nIf you help too much, we cannot use the session data.",
    requiresScenarioGate: true,
    quizDefinition: {
      passScore: 100,
      questions: [
        {
          id: 'golden',
          prompt: 'A participant is stuck. What do you say?',
          options: [
            { id: 'a', label: '"Show me what you would do."', correct: true },
            { id: 'b', label: '"Click here — let me show you."', correct: false },
          ],
        },
        {
          id: 'golden-2',
          prompt: 'Why must you avoid teaching during co-design?',
          options: [
            {
              id: 'a',
              label: 'We need to see what they would do without help — or the data is unusable',
              correct: true,
            },
            { id: 'b', label: 'Teaching is faster so we should help when stuck', correct: false },
          ],
        },
      ],
    },
  },
  {
    slug: 'codesign-before-session',
    title: 'Before the session',
    content:
      'Before each session:\n• Check consent is signed\n• Set up their device\n• Quiet, accessible space\n• Water and break plan ready',
  },
  {
    slug: 'codesign-welcome-script',
    title: 'Welcome script',
    content:
      'Read aloud before you begin:\n• Thank you for helping us today.\n• There are no right or wrong answers.\n• You can stop, take a break, or skip any question.\n\nPause after each line. Wait five seconds before opening Session Capture.',
  },
  {
    slug: 'codesign-during-session',
    title: 'During the session',
    content:
      "• Read scripts as written\n• Let them explore — don't teach\n• Wait 10 seconds before prompting\n• Use their exact words in your notes",
  },
  {
    slug: 'codesign-distress-responses',
    title: 'If someone is confused, tired, upset, or wants to stop',
    content:
      'Confused: "That\'s really helpful — the fact that it\'s confusing is exactly what we need to know."\n\nTired: "Would you like a break?"\n\nDistressed: "We can stop here. You\'ve been really helpful." Do not push further.\n\nWants to stop: Thank them and end. Note where you stopped.',
    requiresScenarioGate: true,
    quizDefinition: {
      passScore: 100,
      questions: [
        {
          id: 'distress',
          prompt: 'The participant looks upset. What do you do?',
          options: [
            { id: 'a', label: 'Stop the session and use the distress script', correct: true },
            { id: 'b', label: 'Keep going so we finish the form', correct: false },
          ],
        },
        {
          id: 'distress-2',
          prompt: 'A participant says they are tired. What do you say?',
          options: [
            { id: 'a', label: '"Would you like a break?"', correct: true },
            { id: 'b', label: '"We only have ten minutes left — keep going."', correct: false },
          ],
        },
      ],
    },
  },
  {
    slug: 'codesign-section-7',
    title: 'Section 7 — say every word',
    content: `Read this word-for-word every session. Do not paraphrase.\n\n${SECTION_7_SCRIPT}`,
    requiresScenarioGate: true,
    linkedFormVersion: SESSION_CAPTURE_FORM_VERSION,
    quizDefinition: {
      passScore: 100,
      questions: [
        {
          id: 's7',
          prompt: 'Can you change the Section 7 wording to make it shorter?',
          options: [
            { id: 'a', label: 'No — read it word-for-word', correct: true },
            { id: 'b', label: 'Yes — if they look bored', correct: false },
          ],
        },
        {
          id: 's7-2',
          prompt: 'A participant asks why data goes to Singapore. What do you do?',
          options: [
            { id: 'a', label: 'Read the Section 7 script — do not improvise', correct: true },
            { id: 'b', label: 'Give a shorter summary in your own words', correct: false },
          ],
        },
      ],
    },
  },
  {
    slug: 'codesign-section-8',
    title: 'Section 8 — contact details rules',
    content:
      'Section 8 is only if they said Yes in Section 7.\n\nContact details are stored separately in the app — never copy them into quotes or facilitator notes.\n\nPrivacy questions: mentors@flaus.com.au',
    requiresScenarioGate: true,
    linkedFormVersion: SESSION_CAPTURE_FORM_VERSION,
    quizDefinition: {
      passScore: 100,
      questions: [
        {
          id: 's8',
          prompt: 'They said No in Section 7. What do you do with Section 8?',
          options: [
            { id: 'a', label: 'Leave Section 8 blank', correct: true },
            { id: 'b', label: 'Still collect email just in case', correct: false },
          ],
        },
        {
          id: 's8-2',
          prompt: 'Where do you store a participant email if they said Yes in Section 7?',
          options: [
            { id: 'a', label: 'Section 8 fields only — never in quotes', correct: true },
            { id: 'b', label: 'In facilitator notes for easy follow-up', correct: false },
          ],
        },
      ],
    },
  },
  {
    slug: 'codesign-quotes-notes',
    title: 'Quotes and notes after they leave',
    content:
      '• Use exact words in quote fields\n• Do not add names or NDIS numbers in other fields\n• Complete Section 9 facilitator notes after the participant has left',
  },
  {
    slug: 'codesign-privacy-basics',
    title: 'What not to put in the form',
    content:
      "OK in session notes: observations, ratings, exact quotes without extra identifiers.\n\nDon't put in notes: participant full names, NDIS numbers, contact details (use Section 8 only).\n\nData may be stored outside Australia (Singapore). Financial Literacy Australia is data custodian for Monash 51358.\n\nPrivacy questions: mentors@flaus.com.au",
  },
  {
    slug: 'codesign-practice-capture',
    title: 'Practice session capture',
    content:
      'Complete a practice Session Capture in the app using fake details only.\n\nSteps: finish prerequisite training → open Practice Capture → submit with invented data → if you pass, live session capture unlocks.\n\nPractice data is auto-deleted after 30 days — not saved as project data.',
  },
]

export const UNIVERSAL_TRAINING_SEEDS: TrainingModuleSeed[] = [
  WHS_INDUCTION_SEED,
  WHS_REMOTE_WORK_SEED,
  WHS_PSYCHOSOCIAL_DEEP_DIVE_SEED,
  WHS_FATIGUE_AND_WORKLOAD_SEED,
  WHS_AGGRESSION_AND_VIOLENCE_SEED,
  WHS_HOME_ERGONOMICS_SEED,
  WHS_WORKING_ALONE_SEED,
  WHS_CONSULTATION_AND_RIGHTS_SEED,
  PRIVACY_BASICS_STAFF_SEED,
]

function resolveContentBlocks(
  slug: string,
  contentBlocks: TrainingContentBlock[] | undefined,
  fallbackContent: string,
): TrainingContentBlock[] {
  if (contentBlocks && contentBlocks.length > 0) return contentBlocks
  console.warn(
    `[seed] Training module ${slug}: missing contentBlocks — using fallback single text block`,
  )
  return [
    {
      id: 'fallback',
      type: 'text',
      title: 'Read this',
      body: fallbackContent,
    },
  ]
}

async function upsertTrainingModule(payload: Payload, seed: TrainingModuleSeed): Promise<'created' | 'updated'> {
  const existing = await payload.find({
    collection: 'training-modules',
    where: { slug: { equals: seed.slug } },
    limit: 1,
    overrideAccess: true,
  })

  const contentBlocks = resolveContentBlocks(seed.slug, seed.contentBlocks, seed.content)

  const data = {
    title: seed.title,
    slug: seed.slug,
    summary: seed.summary,
    content: seed.content,
    contentBlocks,
    moduleType: seed.moduleType ?? ('training' as const),
    requiredForRoles: seed.requiredForRoles ?? (['staff', 'contractor', 'manager'] as const),
    sortOrder: seed.sortOrder,
    version: seed.version ?? 2,
    estimatedMinutes: seed.estimatedMinutes,
    requiresScenarioGate: seed.requiresScenarioGate ?? false,
    quizDefinition: seed.quizDefinition as Record<string, unknown> | undefined,
    linkedFormVersion: seed.linkedFormVersion,
  }

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'training-modules',
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    })
    return 'updated'
  }

  await payload.create({
    collection: 'training-modules',
    data,
    overrideAccess: true,
  })
  return 'created'
}

export async function ensureCoDesignTrainingModules(payload: Payload): Promise<void> {
  let created = 0
  let updated = 0

  for (let i = 0; i < CO_DESIGN_MODULE_SEEDS.length; i++) {
    const mod = CO_DESIGN_MODULE_SEEDS[i]
    const sortOrder = 10 + i
    const rawBlocks =
      mod.slug === 'codesign-section-7'
        ? section7ContentBlocks()
        : mod.slug === 'codesign-section-8'
          ? section8ContentBlocks()
          : buildCoDesignContentBlocks(mod.slug, mod.content)
    const contentBlocks = resolveContentBlocks(mod.slug, rawBlocks, mod.content)

    const result = await upsertTrainingModule(payload, {
      title: mod.title,
      slug: mod.slug,
      summary: CO_DESIGN_SUMMARIES[mod.slug] ?? mod.title,
      content: mod.content,
      contentBlocks,
      requiredForRoles: ['contractor', 'staff'],
      sortOrder,
      requiresScenarioGate: mod.requiresScenarioGate ?? false,
      quizDefinition: mod.quizDefinition,
      linkedFormVersion: mod.linkedFormVersion,
      version: CO_DESIGN_MODULE_VERSIONS[mod.slug] ?? 4,
    })

    if (result === 'created') created++
    else updated++
  }

  console.log(`[seed] Co-design training modules: ${created} created, ${updated} updated`)
}

export async function ensureUniversalTrainingModules(payload: Payload): Promise<void> {
  for (const mod of UNIVERSAL_TRAINING_SEEDS) {
    const result = await upsertTrainingModule(payload, mod)
    console.log(`[seed] Universal training ${mod.slug}: ${result}`)
  }

  for (const slug of RETIRED_TRAINING_MODULE_SLUGS) {
    const existing = await payload.find({
      collection: 'training-modules',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length === 0) continue
    await payload.delete({
      collection: 'training-modules',
      id: existing.docs[0].id,
      overrideAccess: true,
    })
    console.log(`[seed] Universal training ${slug}: removed`)
  }
}

export async function ensureLearningModules(payload: Payload): Promise<void> {
  for (const policy of POLICY_SEEDS) {
    const result = await upsertTrainingModule(payload, policy)
    console.log(`[seed] Policy module ${policy.slug}: ${result}`)
  }
}

/** Assert manifest matches seed constants at module load (dev/test aid). */
export function assertManifestMatchesSeeds(): void {
  for (const seed of [...UNIVERSAL_TRAINING_SEEDS, ...POLICY_SEEDS]) {
    const expected = TRAINING_MODULE_VERSION_MANIFEST[seed.slug]
    if (expected == null) {
      throw new Error(`Manifest missing slug: ${seed.slug}`)
    }
    if (seed.version !== expected) {
      throw new Error(
        `Version mismatch for ${seed.slug}: seed=${seed.version} manifest=${expected}`,
      )
    }
  }
  for (const mod of CO_DESIGN_MODULE_SEEDS) {
    const expected = TRAINING_MODULE_VERSION_MANIFEST[mod.slug]
    const actual = CO_DESIGN_MODULE_VERSIONS[mod.slug] ?? 4
    if (expected == null) {
      throw new Error(`Manifest missing co-design slug: ${mod.slug}`)
    }
    if (actual !== expected) {
      throw new Error(
        `Version mismatch for ${mod.slug}: upsert=${actual} manifest=${expected}`,
      )
    }
  }
}
