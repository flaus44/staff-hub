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
}): { title: string; subtitle: string; href?: string } {
  const actor = formatActor(entry.actor)
  const meta = (entry.metadata ?? {}) as Record<string, unknown>

  switch (entry.action) {
    case 'contract.sign':
      return {
        title: 'Contract signed',
        subtitle: actor,
        href: entry.resourceId
          ? `/admin/collections/contract-signatures/${entry.resourceId}`
          : '/admin/collections/contract-signatures',
      }
    case 'contract.download':
      return { title: 'Contract downloaded', subtitle: actor, href: '/admin/collections/contract-signatures' }
    case 'timesheet.approve':
      return {
        title: meta.approved ? 'Timesheet approved' : 'Timesheet rejected',
        subtitle: actor,
        href: entry.resourceId
          ? `/admin/collections/time-entries/${entry.resourceId}`
          : '/admin/collections/time-entries',
      }
    case 'survey.submit':
      return { title: 'Survey submitted', subtitle: actor, href: '/admin/collections/survey-responses' }
    case 'incident.submit':
      return {
        title: 'Incident reported',
        subtitle: actor,
        href: entry.resourceId
          ? `/admin/collections/incidents/${entry.resourceId}`
          : '/admin/collections/incidents',
      }
    case 'auth.login':
      return { title: 'Signed in', subtitle: actor, href: '/admin/collections/staff-users' }
    case 'auth.mfa_verify':
      return { title: 'MFA verified', subtitle: actor }
    case 'auth.invite_accept':
      return { title: 'Invite accepted', subtitle: actor, href: '/admin/collections/staff-users' }
    default:
      return {
        title: entry.action.replace(/\./g, ' '),
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

export default async function AdminActivityStream({ req }: WidgetServerProps) {
  const { payload } = req

  const logs = await payload.find({
    collection: 'audit-log',
    sort: '-createdAt',
    limit: 5,
    depth: 1,
  })

  return (
    <div className="cmd-activity">
      <div className="cmd-activity__header">
        <h2 className="cmd-section-title">Recent activity</h2>
        <a href="/admin/collections/audit-log" className="cmd-activity__link">
          View all
        </a>
      </div>
      {logs.docs.length === 0 ? (
        <p className="cmd-activity__empty">No activity recorded yet.</p>
      ) : (
        <div className="cmd-activity__list">
          {logs.docs.map((entry) => {
            const { title, subtitle, href } = formatAction({
              action: String(entry.action),
              resourceType: entry.resourceType,
              resourceId: entry.resourceId,
              actor: entry.actor,
              metadata: entry.metadata,
            })
            const { name, tone } = getActivityIcon(String(entry.action))
            const rowContent = (
              <>
                <span className={`cmd-list-row__icon cmd-list-row__icon--${tone}`}>
                  <AdminIcon name={name} size="sm" />
                </span>
                <span className="cmd-list-row__body">
                  <span className="cmd-list-row__title">{title}</span>
                  <span className="cmd-list-row__subtitle">{subtitle}</span>
                </span>
                <span className="cmd-list-row__meta">
                  <span className="cmd-list-row__time">{formatTime(String(entry.createdAt))}</span>
                  {href && (
                    <span className="cmd-list-row__chevron">
                      <IconChevronRight size="sm" />
                    </span>
                  )}
                </span>
              </>
            )

            return href ? (
              <a key={entry.id} href={href} className="cmd-list-row cmd-list-row--link">
                {rowContent}
              </a>
            ) : (
              <div key={entry.id} className="cmd-list-row">
                {rowContent}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
