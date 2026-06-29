import { createHash } from 'node:crypto'

import type { SurveyField } from '@/components/DynamicSurveyForm'

import { isOnboardingPageTask } from '@/lib/onboarding/task-sections'

export type OnboardingSummaryRow = {
  label: string
  value: string
}

export type OnboardingSummarySection = {
  id: string
  title: string
  editHref?: string | null
  rows: OnboardingSummaryRow[]
}

export type OnboardingSummary = {
  sections: OnboardingSummarySection[]
  generatedAt: string
}

export type IncompleteOnboardingTask = {
  id: string | number
  type: string
  title: string
  href: string
}

export type ContractConfirmationGate = {
  canConfirm: boolean
  incompleteTasks: IncompleteOnboardingTask[]
}

type OnboardingTaskDoc = {
  id: string | number
  type: string
  title: string
  status: string
  href?: string | null
  referenceCollection?: string | null
  referenceId?: string | number | null
}

function str(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function yesNo(value: unknown): string {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return ''
}

function citizenshipLabel(path: unknown): string {
  switch (String(path ?? '')) {
    case 'australian_citizen':
      return 'Australian citizen'
    case 'permanent_resident':
      return 'Permanent resident'
    case 'visa_holder':
      return 'Visa holder'
    default:
      return str(path) || 'Not provided'
  }
}

function residencyLabel(value: unknown): string {
  switch (String(value ?? '')) {
    case 'australian_resident':
      return 'Australian resident'
    case 'foreign_resident':
      return 'Foreign resident'
    case 'working_holiday_maker':
      return 'Working holiday maker'
    default:
      return str(value) || 'Not provided'
  }
}

function medicareLabel(value: unknown): string {
  switch (String(value ?? '')) {
    case 'none':
      return 'No exemption'
    case 'full':
      return 'Full exemption'
    case 'half':
      return 'Half exemption'
    default:
      return str(value) || 'Not provided'
  }
}

function taskHref(task: OnboardingTaskDoc): string {
  if (task.href) return task.href
  return `/onboarding/tasks/${task.id}`
}

function isTaskComplete(status: unknown): boolean {
  return status === 'complete'
}

export function getContractConfirmationPrerequisites(
  tasks: OnboardingTaskDoc[],
  _contractId: string | number,
): ContractConfirmationGate {
  const incompleteTasks = tasks
    .filter((task) => isOnboardingPageTask(task.type))
    .filter((task) => task.type !== 'contract')
    .filter((task) => !isTaskComplete(task.status))
    .map((task) => ({
      id: task.id,
      type: task.type,
      title: task.title,
      href: taskHref(task),
    }))

  return {
    canConfirm: incompleteTasks.length === 0,
    incompleteTasks,
  }
}

export function allRequiredContractFieldsPrefilled(
  formDefaults: Record<string, string>,
  formFields: SurveyField[],
): boolean {
  const requiredFields = formFields.filter((field) => field.required !== false)
  if (requiredFields.length === 0) return true

  return requiredFields.every((field) => str(formDefaults[field.id]) !== '')
}

const TASK_EDIT_HREFS: Record<string, string> = {
  fwis: '/onboarding/tasks/fwis',
  rtw: '/onboarding/tasks/rtw',
  profile: '/onboarding/tasks/profile',
  bank: '/onboarding/tasks/bank',
  tax: '/onboarding/tasks/tax',
  super: '/onboarding/tasks/super',
}

export function buildOnboardingSummary(
  user: Record<string, unknown>,
  tasks: OnboardingTaskDoc[] = [],
): OnboardingSummary {
  const profile = (user.profile as Record<string, unknown> | undefined) ?? {}
  const taxDeclaration = (user.taxDeclaration as Record<string, unknown> | undefined) ?? {}
  const superChoiceData = (user.superChoiceData as Record<string, unknown> | undefined) ?? {}

  const editHrefFor = (type: string): string | undefined => {
    const task = tasks.find((entry) => entry.type === type)
    return task ? taskHref(task) : TASK_EDIT_HREFS[type]
  }

  const addressParts = [
    str(profile.addressLine1),
    str(profile.addressLine2),
    str(profile.suburb),
    str(profile.state),
    str(profile.postcode),
  ].filter(Boolean)

  const sections: OnboardingSummarySection[] = [
    {
      id: 'personal',
      title: 'Personal details',
      editHref: editHrefFor('profile'),
      rows: [
        { label: 'Name', value: `${str(user.firstName)} ${str(user.lastName)}`.trim() },
        { label: 'Title', value: str(profile.title) || '—' },
        { label: 'Email', value: str(user.email) },
        { label: 'Date of birth', value: str(profile.dateOfBirth) },
        { label: 'Mobile', value: str(profile.mobile) },
        { label: 'Address', value: addressParts.join(', ') },
        { label: 'Other given names', value: str(profile.otherGivenNames) || '—' },
        { label: 'Employee number', value: str(user.employeeNumber) || '—' },
      ],
    },
    {
      id: 'emergency',
      title: 'Emergency contact',
      editHref: editHrefFor('profile'),
      rows: [
        { label: 'Name', value: str(profile.emergencyContactName) },
        { label: 'Phone', value: str(profile.emergencyContactPhone) },
        { label: 'Relationship', value: str(profile.emergencyContactRelationship) },
      ],
    },
    {
      id: 'employment',
      title: 'Employment',
      rows: [
        { label: 'Start date', value: str(user.startDate).slice(0, 10) },
        { label: 'Employment basis', value: str(user.employmentBasis) || '—' },
        { label: 'Job profile', value: str(user.jobProfile) || '—' },
        { label: 'Award', value: str(user.awardName) || '—' },
        { label: 'Classification', value: str(user.classificationLevel) || '—' },
      ],
    },
    {
      id: 'rtw',
      title: 'Right to work',
      editHref: editHrefFor('rtw'),
      rows: [
        { label: 'Citizenship or visa status', value: citizenshipLabel(user.citizenshipPath) },
        ...(String(user.citizenshipPath ?? '') === 'visa_holder'
          ? [
              { label: 'Visa subclass', value: str(user.visaSubclass) },
              { label: 'Work rights expiry', value: str(user.workRightsExpiry).slice(0, 10) },
            ]
          : []),
      ],
    },
    {
      id: 'bank',
      title: 'Bank details',
      editHref: editHrefFor('bank'),
      rows: [
        { label: 'Account name', value: str(user.bankAccountName) || '—' },
        { label: 'Account number', value: str(user.bankAccountMasked) || '—' },
      ],
    },
    {
      id: 'tax',
      title: 'Tax declaration',
      editHref: editHrefFor('tax'),
      rows: [
        { label: 'Tax file number', value: str(user.tfnMasked) || '—' },
        { label: 'Tax residency', value: residencyLabel(taxDeclaration.residencyStatus) },
        { label: 'Claim tax-free threshold', value: yesNo(taxDeclaration.claimTaxFreeThreshold) },
        { label: 'HELP debt', value: yesNo(taxDeclaration.hasHelpDebt) },
        { label: 'SSL debt', value: yesNo(taxDeclaration.hasSslDebt) },
        { label: 'Medicare exemption', value: medicareLabel(taxDeclaration.medicareExemption) },
        {
          label: 'Official forms',
          value:
            String(user.taxSetupStatus ?? '') === 'employee_confirmed'
              ? 'NAT 3092 and NAT 3093 verified'
              : 'Not complete',
        },
      ],
    },
    {
      id: 'super',
      title: 'Superannuation',
      editHref: editHrefFor('super'),
      rows: buildSuperRows(user, superChoiceData),
    },
  ]

  return {
    sections,
    generatedAt: new Date().toISOString(),
  }
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    )
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function hashOnboardingSummarySnapshot(summary: OnboardingSummary): string {
  return createHash('sha256').update(stableSerialize(summary)).digest('hex')
}

/** Merge contract pre-sign form fields into the frozen confirmation snapshot. */
export function mergeContractFormIntoSummary(
  summary: OnboardingSummary,
  formResponses: Record<string, unknown>,
  fieldLabels: Record<string, string>,
): OnboardingSummary {
  const rows: OnboardingSummaryRow[] = []
  for (const [key, value] of Object.entries(formResponses)) {
    if (value == null || value === '') continue
    rows.push({
      label: fieldLabels[key] ?? key,
      value: String(value),
    })
  }
  if (rows.length === 0) return summary

  const contractSection: OnboardingSummarySection = {
    id: 'contract_details',
    title: 'Contract details',
    rows,
  }

  const existingIndex = summary.sections.findIndex((section) => section.id === 'contract_details')
  const sections =
    existingIndex >= 0
      ? summary.sections.map((section, index) => (index === existingIndex ? contractSection : section))
      : [...summary.sections, contractSection]

  return { ...summary, sections, generatedAt: new Date().toISOString() }
}

export function parseOnboardingSummarySnapshot(raw: unknown): OnboardingSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  if (!Array.isArray(record.sections)) return null
  return {
    sections: record.sections as OnboardingSummarySection[],
    generatedAt: String(record.generatedAt ?? new Date().toISOString()),
  }
}

function buildSuperRows(
  user: Record<string, unknown>,
  superChoiceData: Record<string, unknown>,
): OnboardingSummaryRow[] {
  if (user.superUseDefaultFund === true || superChoiceData.superUseDefaultFund === true) {
    return [
      { label: 'Fund choice', value: 'Employer default fund' },
      {
        label: 'Official form',
        value:
          String(user.superChoiceStatus ?? '') === 'submitted' ? 'NAT 13080 verified' : 'Not complete',
      },
    ]
  }

  if (superChoiceData.superUseSmsf === true) {
    return [
      { label: 'Fund choice', value: 'Self-managed super fund (SMSF)' },
      { label: 'SMSF name', value: str(superChoiceData.smsfName) },
      { label: 'SMSF ABN', value: str(superChoiceData.smsfAbn) },
      { label: 'ESA', value: str(superChoiceData.smsfEsa) },
      {
        label: 'Official form',
        value:
          String(user.superChoiceStatus ?? '') === 'submitted' ? 'NAT 13080 verified' : 'Not complete',
      },
    ]
  }

  return [
    { label: 'Fund name', value: str(user.superFundName) || str(superChoiceData.superFundName) },
    { label: 'Fund USI', value: str(user.superFundId) || str(superChoiceData.superFundId) },
    {
      label: 'Member number',
      value: str(user.superMemberNumber) || str(superChoiceData.superMemberNumber),
    },
    {
      label: 'Letter of compliance',
      value:
        user.superComplianceLetter || superChoiceData.complianceLetterUploadedAt
          ? 'Attached'
          : 'Not provided',
    },
    {
      label: 'Official form',
      value:
        String(user.superChoiceStatus ?? '') === 'submitted' ? 'NAT 13080 verified' : 'Not complete',
    },
  ]
}
