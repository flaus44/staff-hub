export type SurveyFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'yesno'
  | 'number'
  | 'script'
  | 'section'
  | 'attestation'

export type SurveyFieldRole = 'script' | 'participant_response' | 'facilitator_note' | 'contact_pii' | 'gate'

export type SurveyFieldShowWhen = {
  fieldId: string
  equals: string
}

export type SurveyField = {
  id: string
  type: SurveyFieldType
  label: string
  required?: boolean
  options?: string[]
  step?: number
  stepTitle?: string
  helpText?: string
  fieldRole?: SurveyFieldRole
  showWhen?: SurveyFieldShowWhen
  scriptText?: string
}

export type SubmitAttestation = {
  id: string
  label: string
  required?: boolean
}

export const PRIVACY_CONTACT_EMAIL = 'mentors@flaus.com.au'

export const SECTION_7_SCRIPT =
  'Education only. Not personal financial advice, therapy, legal, or tax advice. Not affiliated with or endorsed by the NDIA or NDIS. Not a registered NDIS provider. Whether costs may be claimable depends on your goals, plan, budget, and plan manager decisions. Outcomes are not guaranteed. Session notes may be stored on servers outside Australia (including Singapore). FLAUS is the data custodian for Monash project 51358.'

export const SESSION_CAPTURE_ATTESTATIONS: SubmitAttestation[] = [
  {
    id: 's7_verbatim',
    label: 'I read Section 7 word-for-word to the participant',
    required: true,
  },
  {
    id: 's8_separate',
    label: 'Section 8 contact details were only recorded if Section 7 was Yes (or left blank if No)',
    required: true,
  },
  {
    id: 'exact_quotes',
    label: "Quotes use the participant's exact words with no extra names or NDIS numbers added",
    required: true,
  },
  {
    id: 's9_after',
    label: 'Section 9 facilitator notes were completed after the participant left',
    required: true,
  },
]

export function fieldVisible(field: SurveyField, answers: Record<string, unknown>): boolean {
  if (!field.showWhen) return true
  const value = answers[field.showWhen.fieldId]
  return String(value ?? '') === field.showWhen.equals
}

export function visibleFields(
  fields: SurveyField[],
  answers: Record<string, unknown>,
): SurveyField[] {
  return fields.filter((f) => fieldVisible(f, answers))
}

export function visibleSteps(fields: SurveyField[], answers: Record<string, unknown>): number[] {
  const visible = visibleFields(fields, answers)
  return [...new Set(visible.map((f) => f.step ?? 1))].sort((a, b) => a - b)
}

export function contactFieldIds(fields: SurveyField[]): string[] {
  return fields.filter((f) => f.fieldRole === 'contact_pii').map((f) => f.id)
}

export function stripContactFields(
  answers: Record<string, unknown>,
  contactIds: string[],
): Record<string, unknown> {
  const cleaned = { ...answers }
  for (const id of contactIds) {
    delete cleaned[id]
  }
  return cleaned
}

export function extractContactAnswers(
  answers: Record<string, unknown>,
  contactIds: string[],
): Record<string, unknown> {
  const contact: Record<string, unknown> = {}
  for (const id of contactIds) {
    if (answers[id] !== undefined && answers[id] !== '') {
      contact[id] = answers[id]
    }
  }
  return contact
}
