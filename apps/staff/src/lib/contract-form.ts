import type { SurveyField } from '@/lib/survey-field'

export type ContractPdfFieldMap = Record<string, string>

export const DEFAULT_CONTRACT_FORM_FIELDS: SurveyField[] = [
  { id: 'firstName', type: 'text', label: 'First Name', required: true, step: 1 },
  { id: 'lastName', type: 'text', label: 'Last Name', required: true, step: 1 },
  { id: 'email', type: 'text', label: 'Email Address', required: true, step: 1 },
  { id: 'mobile', type: 'text', label: 'Mobile Number', required: true, step: 1 },
  { id: 'address', type: 'text', label: 'Suburb / City', required: true, step: 2 },
  {
    id: 'state',
    type: 'select',
    label: 'State',
    required: true,
    step: 2,
    options: ['VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'],
  },
  { id: 'postcode', type: 'text', label: 'Postcode', required: true, step: 2 },
  { id: 'startDate', type: 'text', label: 'Start Date (DD/MM/YYYY)', required: true, step: 2 },
]

export const DEFAULT_CONTRACT_PDF_FIELD_MAP: ContractPdfFieldMap = {
  firstName: 'FirstName',
  lastName: 'LastName',
  email: 'Email',
  mobile: 'Phone',
  address: 'Address',
  postcode: 'Postcode',
  startDate: 'AgreementDate',
}

export function resolveContractFormFields(
  fields: SurveyField[] | null | undefined,
): SurveyField[] {
  if (fields && Array.isArray(fields) && fields.length > 0) return fields
  return DEFAULT_CONTRACT_FORM_FIELDS
}

export function resolveContractPdfFieldMap(
  map: ContractPdfFieldMap | null | undefined,
): ContractPdfFieldMap {
  if (map && typeof map === 'object' && Object.keys(map).length > 0) return map
  return DEFAULT_CONTRACT_PDF_FIELD_MAP
}

export function contractFormDefaults(user: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  profile?: {
    mobile?: string | null
    suburb?: string | null
    state?: string | null
    postcode?: string | null
  } | null
}): Record<string, string> {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    mobile: user.profile?.mobile ?? '',
    address: user.profile?.suburb ?? '',
    state: user.profile?.state ?? '',
    postcode: user.profile?.postcode ?? '',
    startDate: new Date().toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  }
}

export const CONTRACT_FORM_STEP_TITLES: Record<number, string> = {
  1: 'Contact information',
  2: 'Role & location details',
}

/** Maps contract form contact/location fields onto staff-user profile. */
export function profileUpdatesFromContractForm(
  formValues: Record<string, unknown>,
): Record<string, string> {
  const profile: Record<string, string> = {}
  const mobile = String(formValues.mobile ?? '').trim()
  const suburb = String(formValues.address ?? '').trim()
  const state = String(formValues.state ?? '').trim()
  const postcode = String(formValues.postcode ?? '').trim()
  if (mobile) profile.mobile = mobile
  if (suburb) profile.suburb = suburb
  if (state) profile.state = state
  if (postcode) profile.postcode = postcode
  return profile
}

/** Overlay saved contract form responses onto defaults (draft, signature, etc.). */
export function mergeContractFormDefaults(
  base: Record<string, string>,
  saved: Record<string, unknown> | null | undefined,
): Record<string, string> {
  if (!saved) return base

  const merged = { ...base }
  for (const key of Object.keys(base)) {
    const value = saved[key]
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      merged[key] = String(value)
    }
  }
  return merged
}

/** Fill only empty profile fields from contract form data. */
export function backfillProfileFromContractForm(
  profile: {
    mobile?: string | null
    suburb?: string | null
    state?: string | null
    postcode?: string | null
  } | null | undefined,
  formValues: Record<string, unknown>,
): Record<string, string> | null {
  const fromForm = profileUpdatesFromContractForm(formValues)
  const updates: Record<string, string> = {}

  for (const [key, value] of Object.entries(fromForm)) {
    const existing = profile?.[key as keyof typeof profile]
    if (value && !String(existing ?? '').trim()) {
      updates[key] = value
    }
  }

  return Object.keys(updates).length > 0 ? updates : null
}
