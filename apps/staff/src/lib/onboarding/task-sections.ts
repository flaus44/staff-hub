export type OnboardingDisplaySection = 'before_first_shift' | 'toolbox' | 'paperwork' | 'payroll'

export const ONBOARDING_DISPLAY_SECTION_ORDER: OnboardingDisplaySection[] = [
  'before_first_shift',
  'toolbox',
  'payroll',
  'paperwork',
]

export const ONBOARDING_DISPLAY_SECTION_LABELS: Record<OnboardingDisplaySection, string> = {
  before_first_shift: 'Before your first shift',
  toolbox: 'Toolbox',
  paperwork: 'Sign and finish',
  payroll: 'Payroll details',
}

const TRAINING_TYPES = new Set(['training', 'policy'])
const SURVEY_TYPES = new Set(['survey'])
const HIDDEN_ONBOARDING_PAGE_TYPES = new Set(['manual'])

export function isTrainingPortalTask(type: string): boolean {
  return TRAINING_TYPES.has(type)
}

export function isToolboxOnboardingTask(type: string): boolean {
  return TRAINING_TYPES.has(type)
}

export function isOnboardingPageTask(type: string): boolean {
  return !TRAINING_TYPES.has(type) && !SURVEY_TYPES.has(type) && !HIDDEN_ONBOARDING_PAGE_TYPES.has(type)
}

/** Portal checklist tasks that gate automatic submit-for-HR-review (matches setup page progress). */
export function isAutoSubmitOnboardingTask(type: string): boolean {
  return isOnboardingPageTask(type)
}

export function areAutoSubmitOnboardingTasksComplete(
  tasks: Array<{ type: string; status?: string | null }>,
): boolean {
  const eligible = tasks.filter((task) => isAutoSubmitOnboardingTask(task.type))
  return eligible.length > 0 && eligible.every((task) => task.status === 'complete')
}

export function onboardingDisplaySection(type: string): OnboardingDisplaySection {
  if (isToolboxOnboardingTask(type)) {
    return 'toolbox'
  }
  if (['fwis', 'rtw'].includes(type)) {
    return 'before_first_shift'
  }
  if (['profile', 'tax', 'bank', 'super'].includes(type)) {
    return 'payroll'
  }
  return 'paperwork'
}

const ONBOARDING_TASK_TYPE_ORDER: Record<OnboardingDisplaySection, string[]> = {
  before_first_shift: ['fwis', 'rtw'],
  toolbox: ['training', 'policy'],
  paperwork: ['contract'],
  payroll: ['profile', 'tax', 'bank', 'super'],
}

function sortTasksWithinSection<T extends { type: string }>(
  section: OnboardingDisplaySection,
  tasks: T[],
): T[] {
  const order = ONBOARDING_TASK_TYPE_ORDER[section]
  const indexByType = new Map(order.map((type, index) => [type, index]))

  return tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const aOrder = indexByType.get(a.task.type) ?? order.length
      const bOrder = indexByType.get(b.task.type) ?? order.length
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.index - b.index
    })
    .map(({ task }) => task)
}

export function sortOnboardingPageTasks<T extends { type: string }>(tasks: T[]): T[] {
  const portalTasks = tasks.filter((task) => isOnboardingPageTask(task.type))

  return ONBOARDING_DISPLAY_SECTION_ORDER.flatMap((section) =>
    sortTasksWithinSection(
      section,
      portalTasks.filter((task) => onboardingDisplaySection(task.type) === section),
    ),
  )
}

export function groupTasksForOnboardingPage<T extends { type: string }>(
  tasks: T[],
): Array<{ section: OnboardingDisplaySection; tasks: T[] }> {
  const portalTasks = tasks.filter((task) => isOnboardingPageTask(task.type))
  const toolboxTasks = tasks.filter((task) => isToolboxOnboardingTask(task.type))

  return ONBOARDING_DISPLAY_SECTION_ORDER.map((section) => ({
    section,
    tasks: sortTasksWithinSection(
      section,
      section === 'toolbox'
        ? toolboxTasks
        : portalTasks.filter((task) => onboardingDisplaySection(task.type) === section),
    ),
  })).filter((entry) => entry.tasks.length > 0)
}
