export type TrainingChecklistItem = {

  id: string

  label: string

}



export type TrainingQuizOption = {

  id: string

  label: string

  correct?: boolean

}



export type TrainingQuizQuestion = {

  id: string

  prompt: string

  options: TrainingQuizOption[]

}



export type TrainingResourceKind = 'pdf' | 'link' | 'video'



export type TrainingContentBlock = {

  id: string

  type: 'text' | 'checklist' | 'quiz' | 'attestation' | 'video' | 'resource' | 'scorm'

  title?: string

  body?: string

  videoUrl?: string

  transcript?: string

  durationMinutes?: number

  checklist?: TrainingChecklistItem[]

  quiz?: TrainingQuizQuestion

  attestationLabel?: string

  resourceUrl?: string

  resourceTitle?: string

  resourceKind?: TrainingResourceKind

  downloadable?: boolean

  attribution?: string

  scormLaunchUrl?: string

}



export type TrainingQuizDefinition = {

  passScore?: number

  questions?: TrainingQuizQuestion[]

}



export const TRAINING_VIDEO_ALLOWLIST = [

  'worksafe.vic.gov.au',

  'www.worksafe.vic.gov.au',

  'youtube.com',

  'www.youtube.com',

  'youtube-nocookie.com',

  'www.youtube-nocookie.com',

  'youtu.be',

] as const

/** WorkSafe / SafeWork NSW clips approved for WHS induction (see training-source-register). */

export const APPROVED_TRAINING_YOUTUBE_IDS = new Set([

  'jFujvZxx9JU',

  'Mfk7I41RRfw',

  'rQ3I1qF-2ws',

  'yF0hoKqgxWI',

  'Tt5_OMy3M6k',

  'cLZj_BRrJug',

])

export function extractYouTubeVideoId(url: string): string | null {

  try {

    const parsed = new URL(url)

    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')

    if (host === 'youtu.be') {

      const id = parsed.pathname.replace(/^\//, '').split('/')[0]

      return id || null

    }

    if (host.includes('youtube')) {

      if (parsed.pathname.startsWith('/embed/')) {

        return parsed.pathname.split('/')[2] ?? null

      }

      if (parsed.pathname === '/watch') {

        return parsed.searchParams.get('v')

      }

    }

    return null

  } catch {

    return null

  }

}



export const TRAINING_RESOURCE_ALLOWLIST = [

  'worksafe.vic.gov.au',

  'www.worksafe.vic.gov.au',

  'content-v2.api.worksafe.vic.gov.au',

  'oaic.gov.au',

  'www.oaic.gov.au',

] as const



export function isAllowedTrainingVideoUrl(url: string): boolean {

  try {

    const parsed = new URL(url)

    const host = parsed.hostname.toLowerCase()

    if (!TRAINING_VIDEO_ALLOWLIST.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {

      return false

    }

    if (host.includes('youtube') || host === 'youtu.be') {

      const videoId = extractYouTubeVideoId(url)

      if (videoId && APPROVED_TRAINING_YOUTUBE_IDS.has(videoId)) return true

      const path = parsed.pathname.toLowerCase()

      return path.includes('worksafe') || parsed.search.toLowerCase().includes('worksafe')

    }

    return true

  } catch {

    return false

  }

}

/** Clean YouTube embed URL for iframe src (strips FLAUS allowlist markers). */

export function resolveTrainingVideoEmbedSrc(url: string): string | null {

  if (!isAllowedTrainingVideoUrl(url)) return null

  const videoId = extractYouTubeVideoId(url)

  if (!videoId) return null

  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`

}



export function isAllowedScormLaunchUrl(url: string): boolean {

  if (!url.startsWith('/training-scorm/')) return false

  if (url.includes('..') || url.includes('//')) return false

  return true

}



export function isAllowedTrainingResourceUrl(url: string): boolean {

  try {

    const parsed = new URL(url)

    const host = parsed.hostname.toLowerCase()

    return TRAINING_RESOURCE_ALLOWLIST.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))

  } catch {

    return false

  }

}



function countWords(text: string): number {

  return text.trim().split(/\s+/).filter(Boolean).length

}



export function estimateBlockMinutes(block: TrainingContentBlock): number {

  switch (block.type) {

    case 'text': {

      const parts = [block.body, block.title].filter(Boolean).join(' ')

      const words = countWords(parts)

      return words > 0 ? Math.min(3, Math.ceil(words / 220)) : 1

    }

    case 'checklist':

      return 1.5

    case 'quiz':

      return 1

    case 'attestation':

      return 0.5

    case 'video':

      return block.durationMinutes ?? 3

    case 'resource':

      return 1

    case 'scorm':

      return block.durationMinutes ?? 30

    default:

      return 1

  }

}



export function estimateStepMinutes(block: TrainingContentBlock): number {

  return Math.max(0.5, Math.round(estimateBlockMinutes(block) * 10) / 10)

}



const MODULE_MIN_MINUTES = 2

const MODULE_MAX_MINUTES = 12



export function estimateModuleReadMinutes(mod: {

  content?: string | null

  contentBlocks?: TrainingContentBlock[] | null

  estimatedMinutes?: number | null

}): number {

  if (mod.estimatedMinutes != null && mod.estimatedMinutes > 0) {

    return mod.estimatedMinutes

  }



  const blocks = mod.contentBlocks ?? []

  if (blocks.length > 0) {

    const total = blocks.reduce((sum, block) => sum + estimateBlockMinutes(block), 0)

    return Math.min(MODULE_MAX_MINUTES, Math.max(MODULE_MIN_MINUTES, Math.round(total)))

  }



  const words = countWords(mod.content ?? '')

  if (words > 0) {

    return Math.min(MODULE_MAX_MINUTES, Math.max(MODULE_MIN_MINUTES, Math.ceil(words / 220)))

  }



  return MODULE_MIN_MINUTES

}



export function estimateRemainingMinutes(

  blocks: TrainingContentBlock[],

  fromStepIndex: number,

): number {

  const remaining = blocks.slice(fromStepIndex).reduce((sum, block) => sum + estimateBlockMinutes(block), 0)

  return Math.max(1, Math.round(remaining))

}



export function extractQuizQuestionsFromModule(mod: {

  quizDefinition?: TrainingQuizDefinition | null

  contentBlocks?: TrainingContentBlock[] | null

}): TrainingQuizQuestion[] {

  const fromBlocks = (mod.contentBlocks ?? [])

    .filter((block) => block.type === 'quiz' && block.quiz)

    .map((block) => block.quiz as TrainingQuizQuestion)

  const fromDefinition = mod.quizDefinition?.questions ?? []

  return [...fromBlocks, ...fromDefinition]

}



export function parseContentBlocksFromUnknown(raw: unknown): TrainingContentBlock[] {

  if (!Array.isArray(raw)) return []

  return raw.filter(

    (b): b is TrainingContentBlock =>

      typeof b === 'object' &&

      b !== null &&

      typeof (b as TrainingContentBlock).id === 'string' &&

      typeof (b as TrainingContentBlock).type === 'string',

  )

}



export function collectBlockQuizQuestions(blocks: TrainingContentBlock[]): TrainingQuizQuestion[] {

  return blocks.filter((b) => b.type === 'quiz' && b.quiz).map((b) => b.quiz as TrainingQuizQuestion)

}



export function isCompletionStale(

  moduleVersion: number | null | undefined,

  completionVersion: number | null | undefined,

): boolean {

  const current = moduleVersion ?? 1

  const completed = completionVersion ?? 1

  return completed < current

}



export function trainingStepStorageKey(moduleId: string | number): string {

  return `flaus-training-step-${moduleId}`

}



export const CO_DESIGN_JOB_AID_SLUGS = [

  'codesign-before-session',

  'codesign-welcome-script',

  'codesign-during-session',

  'codesign-quotes-notes',

  'codesign-privacy-basics',

  'codesign-golden-rule',

  'codesign-distress-responses',

  'codesign-section-7',

  'codesign-section-8',

] as const



const CO_DESIGN_JOB_AID_SLUG_SET = new Set<string>(CO_DESIGN_JOB_AID_SLUGS)



export function cheatSheetPdfHref(): string {

  return '/job-aids/codesign-facilitator-cheat-sheet.pdf'

}



export function cheatSheetPageHref(): string {

  return '/co-design/scripts#cheat-sheet'

}



export function jobAidHref(slug: string): string {

  if (CO_DESIGN_JOB_AID_SLUG_SET.has(slug)) {

    return cheatSheetPageHref()

  }

  return `/job-aids/${slug}.html`

}


