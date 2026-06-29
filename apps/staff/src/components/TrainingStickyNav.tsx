'use client'

import { Button } from '@flaus/ui-forms/Button'
import { Checkbox } from '@flaus/ui-forms/Checkbox'

type TrainingStickyNavProps = {
  stepIndex: number
  totalSteps?: number
  isLastStep: boolean
  canAdvance: boolean
  submitting: boolean
  completeLabel: string
  requiresScenarioGate: boolean
  finalAttestation: boolean
  onFinalAttestationChange: (checked: boolean) => void
  onBack: () => void
  onContinue: () => void
  onComplete: () => void
  error: string | null
}

export function TrainingStickyNav({
  stepIndex,
  totalSteps,
  isLastStep,
  canAdvance,
  submitting,
  completeLabel,
  requiresScenarioGate,
  finalAttestation,
  onFinalAttestationChange,
  onBack,
  onContinue,
  onComplete,
  error,
}: TrainingStickyNavProps) {
  const attestationLabel = requiresScenarioGate
    ? 'I understand this and will follow it in my sessions'
    : 'I have read this module and will follow it in my work for Financial Literacy Australia'

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4 md:static md:mt-2 md:border-0 md:bg-transparent md:p-0">
      <div className="mx-auto max-w-4xl space-y-3">
        {totalSteps && totalSteps > 1 ? (
          <p className="text-center text-xs font-medium text-[var(--cmd-text-muted)] md:hidden">
            Step {stepIndex + 1} of {totalSteps}
          </p>
        ) : null}

        {isLastStep ? (
          <div className="hidden rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4 md:block">
            <p className="mb-2 text-sm font-medium text-[var(--cmd-text)]">Confirm before finishing</p>
            <Checkbox
              id="final-attestation"
              label={attestationLabel}
              checked={finalAttestation}
              onChange={(e) => onFinalAttestationChange(e.target.checked)}
            />
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-[rgba(255,59,48,0.08)] px-3 py-2 text-sm text-[var(--cmd-critical)]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          {stepIndex > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] rounded-xl py-3"
              onClick={onBack}
            >
              Back
            </Button>
          ) : null}
          {!isLastStep ? (
            <Button
              type="button"
              className="min-h-[44px] flex-1 rounded-xl py-3"
              disabled={!canAdvance}
              onClick={onContinue}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-[44px] flex-1 rounded-xl py-3"
              disabled={submitting || !finalAttestation}
              onClick={onComplete}
            >
              {submitting ? 'Saving…' : completeLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
