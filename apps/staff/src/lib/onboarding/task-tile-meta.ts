import type { PortalIconName } from '@/lib/portal-section-meta'

export type OnboardingTaskAccent = {
  bg: string
  fg: string
}

export const ONBOARDING_TASK_ACCENTS: Record<string, OnboardingTaskAccent> = {
  contract: { bg: 'rgba(175, 82, 222, 0.15)', fg: '#af52de' },
  training: { bg: 'rgba(251, 191, 36, 0.15)', fg: '#fbbf24' },
  policy: { bg: 'rgba(251, 146, 60, 0.15)', fg: '#fb923c' },
  survey: { bg: 'rgba(244, 114, 182, 0.15)', fg: '#f472b6' },
  profile: { bg: 'rgba(62, 106, 225, 0.15)', fg: '#3e6ae1' },
  bank: { bg: 'rgba(45, 212, 191, 0.15)', fg: '#2dd4bf' },
  super: { bg: 'rgba(52, 211, 153, 0.15)', fg: '#34d399' },
  fwis: { bg: 'rgba(62, 106, 225, 0.15)', fg: '#3e6ae1' },
  rtw: { bg: 'rgba(45, 212, 191, 0.15)', fg: '#2dd4bf' },
  compliance: { bg: 'rgba(142, 142, 147, 0.15)', fg: '#8e8e93' },
  manual: { bg: 'rgba(142, 142, 147, 0.15)', fg: '#8e8e93' },
  default: { bg: 'rgba(62, 106, 225, 0.15)', fg: '#3e6ae1' },
}

export const ONBOARDING_TASK_ICONS: Record<string, PortalIconName> = {
  contract: 'document',
  training: 'play',
  policy: 'shield',
  survey: 'clipboard',
  profile: 'user',
  bank: 'bank',
  super: 'bank',
  fwis: 'book',
  rtw: 'id-card',
  compliance: 'upload',
  manual: 'check',
}

const COMPLETE_ACCENT: OnboardingTaskAccent = {
  bg: 'rgba(142, 142, 147, 0.12)',
  fg: '#8e8e93',
}

export function onboardingTaskAccent(type: string, status: string): OnboardingTaskAccent {
  if (status === 'complete') return COMPLETE_ACCENT
  return ONBOARDING_TASK_ACCENTS[type] ?? ONBOARDING_TASK_ACCENTS.default
}

export function onboardingTaskIcon(type: string): PortalIconName {
  return ONBOARDING_TASK_ICONS[type] ?? 'clipboard'
}

export function onboardingTaskDisplayTitle(task: { type: string; title: string }): string {
  if (task.type === 'contract') return 'Your contract'
  if (task.type === 'tax') return 'Tax declaration forms'
  if (task.type === 'super') return 'Your super fund'
  if (task.type === 'fwis') return 'Workplace rights statement'
  if (task.type === 'rtw') return 'Right to work details'
  return task.title
}

export function onboardingTaskDescription(type: string): string {
  const map: Record<string, string> = {
    profile: 'Your name, contact details, and emergency contact.',
    tax: 'Complete your tax declaration details for NAT 3092 and NAT 3093.',
    bank: 'Where we pay your wages — account name, BSB, and account number.',
    super: 'Nominate your super fund so contributions go to the right place.',
    fwis:
      'Read the Fair Work Information Statement and Casual Employment Information Statement (for casual employees), then acknowledge receipt.',
    rtw: 'Confirm citizenship, visa details, and work rights in Australia.',
    contract: 'Confirm your details, then review and sign your employment contract.',
  }
  return map[type] ?? 'Complete this step to continue onboarding.'
}

export function onboardingTaskCtaLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Start'
    case 'in_progress':
      return 'Resume'
    case 'awaiting_review':
      return 'View status'
    case 'rejected':
      return 'Fix and resubmit'
    default:
      return 'Continue'
  }
}

export function onboardingStepFocusCtaIsStartHere(completedCount: number, status: string): boolean {
  return completedCount === 0 && status === 'pending'
}

export function onboardingStepFocusCtaLabel(status: string, completedCount: number): string {
  if (status === 'pending') {
    return onboardingStepFocusCtaIsStartHere(completedCount, status) ? 'Start here' : 'Complete now'
  }
  return onboardingTaskCtaLabel(status)
}
