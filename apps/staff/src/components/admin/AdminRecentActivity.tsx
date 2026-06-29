import type { WidgetServerProps } from 'payload'
import React from 'react'

import { AdminIcon, getActivityIcon, IconChevronRight } from './admin-icons'

function formatActor(actor: unknown): string {
  if (!actor || typeof actor !== 'object') return 'System'
  const a = actor as { firstName?: string; lastName?: string; email?: string }
  const name = `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim()
  return name || a.email || 'Staff member'
}

function formatAction(entry: {
  action: string
  resourceType?: string | null
  resourceId?: string | null
  actor?: unknown
  metadata?: unknown
}): { text: string; subtitle: string; href?: string } {
  const actor = formatActor(entry.actor)
  const meta = (entry.metadata ?? {}) as Record<string, unknown>

  switch (entry.action) {
    case 'contract.sign':
      return {
        text: 'Contract signed',
        subtitle: `${actor} completed a contract signature`,
        href: entry.resourceId
          ? `/admin/collections/contract-signatures/${entry.resourceId}`
          : '/admin/collections/contract-signatures',
      }
    case 'contract.download':
      return {
        text: 'Contract downloaded',
        subtitle: `${actor} downloaded a signed contract`,
        href: '/admin/collections/contract-signatures',
      }
    case 'timesheet.approve':
      return {
        text: meta.approved ? 'Timesheet approved' : 'Timesheet rejected',
        subtitle: `${actor} reviewed a time entry`,
        href: entry.resourceId
          ? `/admin/collections/time-entries/${entry.resourceId}`
          : '/admin/collections/time-entries',
      }
    case 'survey.submit':
      return {
        text: 'Survey submitted',
        subtitle: `${actor} submitted a survey response`,
        href: '/admin/collections/survey-responses',
      }
    case 'incident.submit':
      return {
        text: 'Incident reported',
        subtitle: `${actor} submitted an incident report`,
        href: entry.resourceId
          ? `/admin/collections/incidents/${entry.resourceId}`
          : '/admin/collections/incidents',
      }
    case 'auth.login':
      return { text: 'Signed in', subtitle: `${actor} accessed the portal`, href: '/admin/collections/staff-users' }
    case 'auth.mfa_verify':
      return { text: 'MFA verified', subtitle: `${actor} completed multi-factor authentication` }
    case 'auth.invite_accept':
      return {
        text: 'Invite accepted',
        subtitle: `${actor} joined via invitation`,
        href: '/admin/collections/staff-users',
      }
    default:
      return {
        text: entry.action.replace(/\./g, ' '),
        subtitle: actor,
        href: entry.resourceType
          ? `/admin/collections/${entry.resourceType}`
          : '/admin/collections/audit-log',
      }
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function AdminRecentActivity({ req }: WidgetServerProps) {
  const { payload } = req

  const logs = await payload.find({
    collection: 'audit-log',
    sort: '-createdAt',
    limit: 10,
    depth: 1,
  })

  return (
    <div className="staff-hub-admin-activity card">
      <div className="staff-hub-admin-activity__header">
        <h3 className="staff-hub-admin-activity__title">Recent activity</h3>
        <a href="/admin/collections/audit-log" className="staff-hub-admin-activity__link">
          View all
        </a>
      </div>
      {logs.docs.length === 0 ? (
        <p className="staff-hub-admin-activity__empty">No activity recorded yet.</p>
      ) : (
        <div>
          {logs.docs.map((entry) => {
            const { text, subtitle, href } = formatAction({
              action: String(entry.action),
              resourceType: entry.resourceType,
              resourceId: entry.resourceId,
              actor: entry.actor,
              metadata: entry.metadata,
            })
            const { name, tone } = getActivityIcon(String(entry.action))
            const rowContent = (
              <>
                <span className={`admin-list-row__icon admin-list-row__icon--${tone}`}>
                  <AdminIcon name={name} size="sm" />
                </span>
                <span className="admin-list-row__body">
                  <p className="admin-list-row__title">{text}</p>
                  <p className="admin-list-row__subtitle">{subtitle}</p>
                </span>
                <span className="admin-list-row__meta">
                  <span className="admin-list-row__time">{formatTime(String(entry.createdAt))}</span>
                  {href && (
                    <span className="admin-list-row__chevron">
                      <IconChevronRight size="sm" />
                    </span>
                  )}
                </span>
              </>
            )

            return href ? (
              <a key={entry.id} href={href} className="admin-list-row admin-list-row--link">
                {rowContent}
              </a>
            ) : (
              <div key={entry.id} className="admin-list-row">
                {rowContent}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
