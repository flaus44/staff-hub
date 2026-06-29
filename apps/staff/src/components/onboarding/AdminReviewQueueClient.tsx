'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@flaus/ui-forms/Button'

type QueueItem = {
  id: string | number
  user?: { id?: string | number; firstName?: string; lastName?: string; email?: string } | string | number
  status?: string
  submittedAt?: string
  reviewer?: unknown
}

async function postJson(path: string, body: Record<string, unknown>) {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.error || 'Request failed')
  }
}

export function AdminReviewQueueClient({ queue }: { queue: QueueItem[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  async function run(id: string, handler: () => Promise<void>) {
    setLoadingId(id)
    setError('')
    try {
      await handler()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process action')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-[var(--cmd-critical)]">{error}</p> : null}
      {queue.length === 0 ? (
        <p className="text-sm text-[var(--cmd-text-muted)]">No onboarding submissions awaiting review</p>
      ) : null}
      {queue.map((item) => {
        const user =
          typeof item.user === 'object' && item.user
            ? item.user
            : { id: item.user, firstName: 'Unknown', lastName: '', email: '' }
        const id = String(item.id)
        const userId = String(user.id ?? '')
        const isLoading = loadingId === id
        const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Unknown'

        return (
          <div
            key={id}
            className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4"
          >
            <p className="text-sm font-semibold text-[var(--cmd-text)]">{name}</p>
            <p className="text-xs text-[var(--cmd-text-muted)]">{user.email ?? ''}</p>
            <p className="mt-1 text-xs text-[var(--cmd-text-muted)]">
              Status: {item.status ?? 'submitted'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={isLoading}
                onClick={() =>
                  run(id, () =>
                    postJson('/api/onboarding/review/claim', {
                      assignmentId: item.id,
                    }),
                  )
                }
              >
                Claim
              </Button>
              <Button
                disabled={isLoading}
                onClick={() =>
                  run(id, () =>
                    postJson('/api/onboarding/review/decision', {
                      assignmentId: item.id,
                      decision: 'approve',
                    }),
                  )
                }
              >
                Approve
              </Button>
              <Button
                variant="outline"
                disabled={isLoading}
                onClick={() =>
                  run(id, () =>
                    postJson('/api/onboarding/review/decision', {
                      assignmentId: item.id,
                      decision: 'reject',
                      note: 'Please review the rejected checklist items.',
                    }),
                  )
                }
              >
                Reject
              </Button>
              <Button
                variant="outline"
                disabled={isLoading}
                onClick={() =>
                  run(id, () =>
                    postJson('/api/onboarding/payroll-packet', {
                      userId,
                      format: 'csv',
                    }),
                  )
                }
              >
                Export CSV
              </Button>
              <Button
                variant="outline"
                disabled={isLoading}
                onClick={() =>
                  run(id, () =>
                    postJson('/api/onboarding/payroll-packet', {
                      userId,
                      format: 'pdf',
                    }),
                  )
                }
              >
                Export PDF
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
