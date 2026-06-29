'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@flaus/ui-forms/Button'
import { Checkbox } from '@flaus/ui-forms/Checkbox'
import type {
  ContractConfirmationGate,
  OnboardingSummary,
} from '@/lib/onboarding/onboarding-summary'

export function ContractOnboardingConfirmation({
  summary,
  gate,
  loading,
  error,
  onConfirm,
  onBack,
  showBack,
}: {
  summary: OnboardingSummary
  gate: ContractConfirmationGate
  loading?: boolean
  error?: string
  onConfirm: () => void
  onBack?: () => void
  showBack?: boolean
}) {
  const [declared, setDeclared] = useState(false)

  if (!gate.canConfirm) {
    return (
      <div className="space-y-5 max-w-3xl">
        <div>
          <h2 className="text-xl font-semibold text-[var(--cmd-text)]">Complete onboarding first</h2>
          <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">
            Finish the steps below before you can review your details and sign your contract.
          </p>
        </div>
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4">
          <p className="text-sm font-medium text-amber-900">Outstanding tasks</p>
          <ul className="mt-3 space-y-2">
            {gate.incompleteTasks.map((task) => (
              <li key={String(task.id)}>
                <Link
                  href={task.href}
                  className="text-sm font-medium text-[var(--cmd-accent)] hover:underline"
                >
                  {task.title} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/onboarding/setup"
          className="inline-flex items-center justify-center rounded-xl border border-[var(--cmd-border)] px-4 py-2 text-sm font-medium text-[var(--cmd-text)] hover:bg-[var(--cmd-surface-raised)]"
        >
          Return to onboarding checklist
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-[var(--cmd-text)]">Confirm your details</h2>
        <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">
          Review everything you have provided during onboarding. If anything is incorrect, use Edit
          to update it before signing your contract.
        </p>
      </div>

      <div className="space-y-4">
        {summary.sections.map((section) => (
          <section
            key={section.id}
            className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--cmd-border)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--cmd-text)]">{section.title}</h3>
              {section.editHref ? (
                <Link
                  href={section.editHref}
                  className="text-xs font-medium text-[var(--cmd-accent)] hover:underline whitespace-nowrap"
                >
                  Edit
                </Link>
              ) : null}
            </div>
            <dl className="divide-y divide-[var(--cmd-border)]">
              {section.rows.map((row) => (
                <div
                  key={`${section.id}-${row.label}`}
                  className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,200px)_1fr]"
                >
                  <dt className="text-xs font-medium text-[var(--cmd-text-muted)]">{row.label}</dt>
                  <dd className="text-sm text-[var(--cmd-text)] break-words">{row.value || '—'}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="rounded-xl border border-[rgba(62,106,225,0.35)] bg-[rgba(62,106,225,0.08)] px-4 py-4">
        <Checkbox
          id="onboarding-details-declaration"
          label="I confirm that all information shown above is true and correct."
          checked={declared}
          onChange={(event) => setDeclared(event.target.checked)}
        />
      </div>

      {error ? <p className="text-sm text-[var(--cmd-critical)]">{error}</p> : null}

      <div className="flex flex-wrap justify-between gap-3">
        {showBack && onBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" onClick={onConfirm} disabled={!declared || loading}>
          {loading ? 'Saving…' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
