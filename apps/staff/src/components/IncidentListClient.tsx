'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { IconAlert } from '@/components/portal-icons'
import { ListRow } from '@flaus/ui-forms/ListRow'
import { PortalCard } from '@flaus/ui-forms/PortalCard'
import { StatusPill } from '@flaus/ui-forms/StatusPill'

type IncidentRow = {
  id: string
  category: string
  description: string
  location: string
  occurredAt: string
  status: string
  severity: string
}

function statusVariant(status: string): 'success' | 'warning' | 'info' | 'neutral' | 'danger' {
  if (status === 'closed') return 'success'
  if (status === 'under_review') return 'info'
  return 'warning'
}

export function IncidentListClient({
  incidents,
  isManager,
}: {
  incidents: IncidentRow[]
  isManager: boolean
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (statusFilter !== 'all' && inc.status !== statusFilter) return false
      if (severityFilter !== 'all' && inc.severity !== severityFilter) return false
      return true
    })
  }, [incidents, statusFilter, severityFilter])

  return (
    <div className="space-y-4">
      {isManager && (
        <div className="flex flex-wrap gap-2">
          {['all', 'submitted', 'under_review', 'closed'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium min-h-[36px] ${
                statusFilter === s ? 'bg-primary-700 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {s === 'all' ? 'All statuses' : s.replace('_', ' ')}
            </button>
          ))}
          <span className="w-px bg-slate-200 mx-1 hidden sm:block" />
          {['all', 'low', 'medium', 'high'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverityFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium min-h-[36px] ${
                severityFilter === s ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {s === 'all' ? 'All severity' : s}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 max-w-3xl">
        {filtered.map((inc) => (
          <Link key={inc.id} href={`/incidents/${inc.id}`} className="block group">
            <PortalCard padding="sm" className="transition-shadow group-hover:shadow-md group-hover:border-primary-200">
              <ListRow
                icon={<IconAlert />}
                primary={<span className="capitalize">{inc.category.replace('_', ' ')}</span>}
                secondary={`${new Date(inc.occurredAt).toLocaleString('en-AU')} · ${inc.location}`}
                meta={<span className="line-clamp-1 text-slate-600">{inc.description}</span>}
                trailing={
                  <div className="flex flex-col items-end gap-1">
                    <StatusPill status={inc.status.replace('_', ' ')} variant={statusVariant(inc.status)} />
                    <span className="text-xs text-slate-400 capitalize">{inc.severity}</span>
                  </div>
                }
                showChevron
              />
            </PortalCard>
          </Link>
        ))}
        {filtered.length === 0 && incidents.length > 0 && (
          <p className="text-sm text-slate-500">No incidents match the selected filters.</p>
        )}
      </div>
    </div>
  )
}
