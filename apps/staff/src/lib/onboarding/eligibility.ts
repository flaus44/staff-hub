import type { Payload } from 'payload'
import { redirect } from 'next/navigation'

export type EligibilityContext = 'clock-in' | 'middleware' | 'xero-push' | 'portal'

export type BlockReason = {
  code: string
  message: string
  href: string
}

export type EligibilityResult = {
  canWork: boolean
  canWorkUnsupervised: boolean
  canBePaid: boolean
  canSubmitTimesheet: boolean
  canAccessStaffPortal: boolean
  blockReasons: BlockReason[]
}

function isComplete(status: unknown): boolean {
  return status === 'complete'
}

function relationId(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}

function nowIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function toDateOnly(value: unknown): string | null {
  if (!value) return null
  const text = String(value)
  if (!text) return null
  return text.slice(0, 10)
}

function hasConfirmedWorkRights(user: Record<string, unknown>): {
  ok: boolean
  expired: boolean
} {
  const rtwStatus = String(user.rtwStatus ?? 'not_started')
  const citizenshipPath = String(user.citizenshipPath ?? '')
  const visaSubclass = String(user.visaSubclass ?? '').trim()
  const workRightsExpiry = toDateOnly(user.workRightsExpiry)
  const today = nowIsoDate()

  if (!['submitted', 'verified'].includes(rtwStatus)) {
    return { ok: false, expired: false }
  }
  if (!['australian_citizen', 'permanent_resident', 'visa_holder'].includes(citizenshipPath)) {
    return { ok: false, expired: false }
  }
  if (citizenshipPath !== 'visa_holder') {
    return { ok: true, expired: false }
  }

  if (!visaSubclass || !workRightsExpiry) {
    return { ok: false, expired: false }
  }
  if (workRightsExpiry < today) {
    return { ok: false, expired: true }
  }
  return { ok: true, expired: false }
}

async function hasActiveOverride(payload: Payload, userId: string, field: 'allowsClockIn' | 'allowsPayroll') {
  const now = new Date().toISOString()
  const result = await payload.find({
    collection: 'onboarding-overrides',
    where: {
      and: [
        { user: { equals: userId } },
        { active: { equals: true } },
        { [field]: { equals: true } },
        { expiresAt: { greater_than_equal: now } },
      ],
    },
    limit: 1,
  })

  return Boolean(result.docs[0])
}

export async function getOnboardingEligibility(
  payload: Payload,
  userId: string,
  context: EligibilityContext = 'portal',
): Promise<EligibilityResult> {
  const [user, tasksResult] = await Promise.all([
    payload.findByID({
      collection: 'staff-users',
      id: userId,
      depth: 0,
      disableErrors: true,
    }),
    payload.find({
      collection: 'onboarding-tasks',
      where: { user: { equals: userId } },
      limit: 500,
      depth: 0,
    }),
  ])

  if (!user) {
    return {
      canWork: false,
      canWorkUnsupervised: false,
      canBePaid: false,
      canSubmitTimesheet: false,
      canAccessStaffPortal: false,
      blockReasons: [{ code: 'not_found', message: 'Your onboarding record was not found.', href: '/onboarding' }],
    }
  }

  if (String(user.role) === 'admin') {
    return {
      canWork: true,
      canWorkUnsupervised: true,
      canBePaid: true,
      canSubmitTimesheet: true,
      canAccessStaffPortal: true,
      blockReasons: [],
    }
  }

  const accountStatus = String(user.status ?? 'active')

  if (accountStatus === 'inactive') {
    return {
      canWork: false,
      canWorkUnsupervised: false,
      canBePaid: false,
      canSubmitTimesheet: false,
      canAccessStaffPortal: false,
      blockReasons: [
        {
          code: 'account_inactive',
          message: 'Your account is inactive. Contact HR if you believe this is an error.',
          href: '/onboarding',
        },
      ],
    }
  }

  const activeAccountOverride = accountStatus === 'active'
  const onboardingStatus = String(user.onboardingStatus ?? 'in_progress')
  const startDate = toDateOnly(user.startDate)
  const today = nowIsoDate()
  const workBlockingTasks = tasksResult.docs.filter(
    (task) =>
      Array.isArray(task.blocks) && task.blocks.includes('canWork'),
  )
  const payBlockingTasks = tasksResult.docs.filter(
    (task) =>
      Array.isArray(task.blocks) &&
      task.blocks.includes('canBePaid') &&
      task.type !== 'manual',
  )
  const unsupervisedTasks = tasksResult.docs.filter(
    (task) => Array.isArray(task.blocks) && task.blocks.includes('canWorkUnsupervised'),
  )

  const missingWorkTask = workBlockingTasks.find((task) => !isComplete(task.status))
  const missingPayTask = payBlockingTasks.find((task) => !isComplete(task.status))
  const missingUnsupervisedTask = unsupervisedTasks.find((task) => !isComplete(task.status))

  const blockReasons: BlockReason[] = []

  if (startDate && startDate > today) {
    blockReasons.push({
      code: 'not_started_yet',
      message: `You can start onboarding now, but work unlocks on ${startDate}.`,
      href: '/onboarding',
    })
  }

  if (missingWorkTask && !activeAccountOverride) {
    const portalBlock = context === 'portal'
    blockReasons.push({
      code: 'blocking_task_incomplete',
      message: portalBlock
        ? 'Complete all onboarding to proceed'
        : `${missingWorkTask.title} must be completed before you can work.`,
      href: portalBlock ? '/onboarding' : missingWorkTask.href || '/onboarding',
    })
  }

  const workRights = hasConfirmedWorkRights(user)
  if (!workRights.ok && !activeAccountOverride) {
    const portalBlock = context === 'portal'
    blockReasons.push({
      code: workRights.expired ? 'work_rights_expired' : 'work_rights_incomplete',
      message: portalBlock
        ? 'Complete all onboarding to proceed'
        : workRights.expired
          ? 'Your recorded work rights have expired. Please update your details.'
          : 'Confirm your work rights in Australia to continue.',
      href: portalBlock ? '/onboarding' : '/onboarding/tasks/rtw',
    })
  }

  if (
    !activeAccountOverride &&
    onboardingStatus !== 'approved' &&
    onboardingStatus !== 'active'
  ) {
    blockReasons.push({
      code: 'awaiting_approval',
      message: 'Your onboarding is still awaiting HR approval.',
      href: '/onboarding',
    })
  }

  const hasClockInOverride = await hasActiveOverride(payload, userId, 'allowsClockIn')
  const workBlockingCodes = new Set([
    'not_started_yet',
    'blocking_task_incomplete',
    'awaiting_approval',
    'work_rights_incomplete',
    'work_rights_expired',
  ])
  const canWorkBase = blockReasons.every((reason) => !workBlockingCodes.has(reason.code))
  const canWork = activeAccountOverride || canWorkBase || hasClockInOverride

  if (missingPayTask) {
    blockReasons.push({
      code: 'payroll_task_incomplete',
      message: `${missingPayTask.title} is required before first pay.`,
      href: missingPayTask.href || '/onboarding',
    })
  }

  const hasPayrollOverride = await hasActiveOverride(payload, userId, 'allowsPayroll')
  const canBePaid = !missingPayTask || hasPayrollOverride

  const canWorkUnsupervised = canWork && !missingUnsupervisedTask
  if (canWork && missingUnsupervisedTask) {
    blockReasons.push({
      code: 'supervision_required',
      message: 'You can work supervised while final compliance checks are reviewed.',
      href: '/onboarding',
    })
  }

  const canSubmitTimesheet = activeAccountOverride || canWork
  const canAccessStaffPortal =
    activeAccountOverride || (canWork && ['approved', 'active'].includes(onboardingStatus))

  if (context === 'clock-in' && !canWork && blockReasons.length === 0) {
    blockReasons.push({
      code: 'ineligible_for_clock_in',
      message: 'You are not eligible to clock in yet.',
      href: '/onboarding',
    })
  }

  return {
    canWork,
    canWorkUnsupervised,
    canBePaid,
    canSubmitTimesheet,
    canAccessStaffPortal,
    blockReasons,
  }
}

export function firstBlockingReason(result: EligibilityResult): BlockReason | null {
  return result.blockReasons[0] ?? null
}

export async function requireOnboardingEligibility({
  payload,
  userId,
  context = 'portal',
  allowBeforeApproval = false,
}: {
  payload: Payload
  userId: string
  context?: EligibilityContext
  allowBeforeApproval?: boolean
}) {
  const result = await getOnboardingEligibility(payload, userId, context)
  const needsPortalApproval = context === 'clock-in' ? !result.canWork : !result.canAccessStaffPortal

  if (needsPortalApproval) {
    if (allowBeforeApproval) {
      const user = await payload.findByID({
        collection: 'staff-users',
        id: userId,
        depth: 0,
        disableErrors: true,
      })
      const status = String(user?.onboardingStatus ?? 'in_progress')
      if (['invited', 'in_progress', 'submitted', 'pending_admin_review', 'rejected'].includes(status)) {
        return result
      }
    }
    redirect('/onboarding')
  }
  return result
}
