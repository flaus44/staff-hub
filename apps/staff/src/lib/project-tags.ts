export const PROJECT_TAG_OPTIONS = [
  'Co-design Wave 1',
  'Workshop delivery',
  'Training',
] as const

export type ProjectTag = (typeof PROJECT_TAG_OPTIONS)[number]

export const PROJECT_TAG_PLACEHOLDER = 'Select project…'

export const PROJECT_TAG_SELECT_OPTIONS = [
  { value: '', label: PROJECT_TAG_PLACEHOLDER },
  ...PROJECT_TAG_OPTIONS.map((value) => ({
    value,
    label: value,
  })),
]

export function isProjectTag(value: string): value is ProjectTag {
  return (PROJECT_TAG_OPTIONS as readonly string[]).includes(value)
}
