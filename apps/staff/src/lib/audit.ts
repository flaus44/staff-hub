import type { Payload } from 'payload'

import type { StaffUser } from '@/access/roles'
import { relIdNumber } from '@/lib/payload-relations'

export type AuditAction =
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.mfa_verify'
  | 'auth.invite_accept'
  | 'export.csv'
  | 'timesheet.approve'
  | 'timesheet.correct'
  | 'contract.sign'
  | 'contract.download'
  | 'onboarding.form_preview'
  | 'onboarding.document_download'
  | 'onboarding.super_compliance_upload'
  | 'onboarding.super_compliance_delete'
  | 'incident.submit'
  | 'incident.view'
  | 'survey.submit'
  | 'training.complete'
  | 'contact_data.access'
  | 'admin.user_update'

export async function writeAuditLog(
  payload: Payload,
  args: {
    actorId?: string | number | null
    action: AuditAction
    resourceType: string
    resourceId?: string | number | null
    ip?: string | null
    userAgent?: string | null
    metadata?: Record<string, unknown>
  },
): Promise<void> {
  try {
    await payload.create({
      collection: 'audit-log',
      data: {
        actor: relIdNumber(args.actorId),
        action: args.action,
        resourceType: args.resourceType,
        resourceId: args.resourceId != null ? String(args.resourceId) : null,
        ipAddress: args.ip ?? null,
        userAgent: args.userAgent ?? null,
        metadata: args.metadata ?? {},
      },
      overrideAccess: true,
    })
  } catch (error) {
    console.error('[audit-log] failed to write', error)
  }
}

export function requestMeta(req: { headers: Headers }): { ip: string | null; userAgent: string | null } {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip')
  return {
    ip: ip ?? null,
    userAgent: req.headers.get('user-agent'),
  }
}

export function actorIdFromUser(user: StaffUser | null | undefined): string | null {
  if (!user?.id) return null
  return String(user.id)
}
