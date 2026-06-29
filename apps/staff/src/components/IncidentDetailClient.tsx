'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { updateIncidentStatus } from '@/app/actions/incidents'
import { Button } from '@flaus/ui-forms/Button'
import { ListRow } from '@flaus/ui-forms/ListRow'
import { PortalCard } from '@flaus/ui-forms/PortalCard'
import { Select } from '@flaus/ui-forms/Select'
import { StatusPill } from '@flaus/ui-forms/StatusPill'

type Witness = { name?: string; contact?: string; role?: string }

export type IncidentDetail = {
  id: string
  category: string
  description: string
  location: string
  occurredAt: string
  status: string
  severity: string
  immediateActions?: string
  treatmentRequired?: boolean
  witnesses?: Witness[]
  reporterName?: string
}

function statusVariant(status: string): 'success' | 'warning' | 'info' | 'neutral' | 'danger' {
  if (status === 'closed') return 'success'
  if (status === 'under_review') return 'info'
  if (status === 'submitted') return 'warning'
  return 'neutral'
}

const STATUS_STEPS = ['submitted', 'under_review', 'closed'] as const

export function IncidentDetailClient({
  incident,
  isManager,
}: {
  incident: IncidentDetail
  isManager: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState(incident.status)
  const [error, setError] = useState('')

  function handleStatusUpdate() {
    setError('')
    startTransition(async () => {
      const result = await updateIncidentStatus(incident.id, status)
      if (result.error) {
        setError('Could not update status')
        return
      }
      router.refresh()
    })
  }

  const currentStepIndex = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number])

  return (
    <div className="max-w-3xl space-y-6">
      <PortalCard>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--cmd-text-muted)]">Incident report</p>
            <h2 className="text-xl font-semibold text-[var(--cmd-text)] capitalize mt-1">
              {incident.category.replace('_', ' ')}
            </h2>
            <p className="text-sm text-[var(--cmd-text-muted)] mt-1">Reference #{incident.id}</p>
          </div>
          <StatusPill status={incident.status.replace('_', ' ')} variant={statusVariant(incident.status)} />
        </div>

        <nav aria-label="Status timeline" className="mb-6">
          <ol className="flex items-center gap-2">
            {STATUS_STEPS.map((step, index) => {
              const done = currentStepIndex >= index
              const active = incident.status === step
              return (
                <li key={step} className="flex items-center flex-1">
                  <div
                    className={`flex items-center gap-2 text-xs font-medium capitalize ${
                      done ? 'text-primary-700' : 'text-[var(--cmd-text-muted)]'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                        active ? 'bg-primary-700 text-white' : done ? 'bg-primary-100 text-primary-700' : 'bg-[var(--cmd-surface-raised)]'
                      }`}
                    >
                      {done && !active ? '✓' : index + 1}
                    </span>
                    <span className="hidden sm:inline">{step.replace('_', ' ')}</span>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-primary-200' : 'bg-[var(--cmd-surface-raised)]'}`} />
                  )}
                </li>
              )
            })}
          </ol>
        </nav>

        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          {(
            [
              { label: 'When', value: new Date(incident.occurredAt).toLocaleString('en-AU') },
              { label: 'Where', value: incident.location },
              { label: 'Severity', value: incident.severity, capitalize: true as const },
              ...(incident.reporterName ? [{ label: 'Reporter', value: incident.reporterName }] : []),
              { label: 'Treatment required', value: incident.treatmentRequired ? 'Yes' : 'No', span: true as const },
            ] as Array<{ label: string; value: string; capitalize?: boolean; span?: boolean }>
          ).map((field) => (
            <div
              key={field.label}
              className={`flex justify-between gap-4 py-2 border-b border-[var(--cmd-border)] ${field.span ? 'sm:col-span-2' : ''}`}
            >
              <dt className="text-[var(--cmd-text-muted)] shrink-0">{field.label}</dt>
              <dd className={`font-medium text-[var(--cmd-text)] text-right ${field.capitalize ? 'capitalize' : ''}`}>
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </PortalCard>

      <PortalCard title="Description">
        <p className="text-sm text-[var(--cmd-text)] whitespace-pre-wrap">{incident.description}</p>
        {incident.immediateActions && (
          <div className="mt-4 pt-4 border-t border-[var(--cmd-border)]">
            <p className="text-xs font-medium text-[var(--cmd-text-muted)] uppercase tracking-wide mb-1">Immediate actions</p>
            <p className="text-sm text-[var(--cmd-text)] whitespace-pre-wrap">{incident.immediateActions}</p>
          </div>
        )}
      </PortalCard>

      {incident.witnesses && incident.witnesses.length > 0 && (
        <PortalCard title="Witnesses">
          <div>
            {incident.witnesses.map((w, i) => (
              <ListRow
                key={i}
                primary={w.name || 'Unnamed witness'}
                secondary={w.role}
                meta={w.contact}
              />
            ))}
          </div>
        </PortalCard>
      )}

      {isManager && (
        <PortalCard title="Manager actions">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Select
                id="status"
                label="Update status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: 'submitted', label: 'Submitted' },
                  { value: 'under_review', label: 'Under review' },
                  { value: 'closed', label: 'Closed' },
                ]}
              />
            </div>
            <Button onClick={handleStatusUpdate} disabled={pending || status === incident.status}>
              {pending ? 'Saving…' : 'Save status'}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </PortalCard>
      )}

      <Link href="/incidents" className="inline-block text-sm font-medium text-primary-700 hover:underline">
        ← Back to incidents
      </Link>
    </div>
  )
}
