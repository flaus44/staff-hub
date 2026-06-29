'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { ContractDetailsForm } from '@/components/ContractDetailsForm'
import { ContractOnboardingConfirmation } from '@/components/ContractOnboardingConfirmation'
import type { SurveyField } from '@/components/DynamicSurveyForm'
import { SignaturePad } from '@flaus/ui-forms/SignaturePad'
import { Button } from '@flaus/ui-forms/Button'
import { Checkbox } from '@flaus/ui-forms/Checkbox'
import { PortalCard } from '@flaus/ui-forms/PortalCard'
import type { ContractDocumentPreview } from '@/lib/media-files'
import { E_SIGN_CONSENT_TEXT } from '@/lib/esign-client'
import type { ContractConfirmationGate, OnboardingSummary } from '@/lib/onboarding/onboarding-summary'
import { allRequiredContractFieldsPrefilled } from '@/lib/onboarding/onboarding-summary'

function signErrorMessage(code: string): string {
  switch (code) {
    case 'invalid_input':
      return 'Some signing details were invalid. Please refresh and try again.'
    case 'already_signed':
      return 'You have already signed this contract.'
    case 'didit_verification_required':
      return 'Identity verification is required before signing.'
    case 'didit_not_approved':
      return 'Identity verification must be approved before signing.'
    case 'onboarding_confirmation_required':
      return 'Please confirm your onboarding details before signing.'
    case 'unauthorised':
      return 'Your session expired. Please sign in again.'
    default:
      return code || 'Signing failed'
  }
}

type Phase = 'details' | 'confirm' | 'verify' | 'review' | 'checking' | 'declined'

async function readSignError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    return signErrorMessage(data.error || 'Signing failed')
  } catch {
    return `Signing failed (${res.status})`
  }
}

type FlowStep = { id: Phase; label: string }

function buildFlowSteps(
  showDetailsStep: boolean,
  requireDiditVerification: boolean,
): FlowStep[] {
  const steps: FlowStep[] = []
  if (showDetailsStep) steps.push({ id: 'details', label: 'Your details' })
  steps.push({ id: 'confirm', label: 'Confirm your details' })
  if (requireDiditVerification) steps.push({ id: 'verify', label: 'Verify identity' })
  steps.push({ id: 'review', label: 'Review & sign' })
  return steps
}

function ContractFlowStepper({
  steps,
  current,
}: {
  steps: FlowStep[]
  current: Phase
}) {
  const activeIndex = steps.findIndex((s) => s.id === current)
  const resolvedIndex = activeIndex >= 0 ? activeIndex : steps.length - 1

  return (
    <nav aria-label="Signing progress" className="mb-8">
      <ol className="flex items-center gap-2 sm:gap-0">
        {steps.map((step, index) => {
          const done = index < resolvedIndex
          const active = index === resolvedIndex
          return (
            <li key={step.id} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 min-w-0 w-full">
                <span
                  className={[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    done ? 'bg-[rgba(48,209,88,0.15)] text-[var(--cmd-live)]' : active ? 'bg-[var(--cmd-accent)] text-white' : 'bg-[var(--cmd-surface-raised)] text-[var(--cmd-text-muted)]',
                  ].join(' ')}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? '✓' : index + 1}
                </span>
                <span
                  className={[
                    'text-[11px] sm:text-sm font-medium truncate text-center sm:text-left',
                    active ? 'text-[var(--cmd-text)]' : done ? 'text-[var(--cmd-live)]' : 'text-[var(--cmd-text-muted)]',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={['hidden sm:block h-0.5 flex-1 mx-3 rounded', done ? 'bg-[var(--cmd-live)]' : 'bg-[var(--cmd-border)]'].join(' ')}
                  aria-hidden
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

interface ContractSignClientProps {
  contractId: string
  title: string
  bodyText: string
  documents: ContractDocumentPreview[]
  formFields: SurveyField[]
  formDefaults: Record<string, string>
  requiresDetailsForm: boolean
  requireDiditVerification: boolean
  diditConfigured: boolean
  onboardingSummary: OnboardingSummary
  confirmationGate: ContractConfirmationGate
}

export function ContractSignClient({
  contractId,
  title,
  bodyText,
  documents,
  formFields,
  formDefaults,
  requiresDetailsForm,
  requireDiditVerification,
  diditConfigured,
  onboardingSummary,
  confirmationGate,
}: ContractSignClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialDraftId = searchParams.get('draftId')
  const showDetailsStep =
    requiresDetailsForm && !allRequiredContractFieldsPrefilled(formDefaults, formFields)

  const [phase, setPhase] = useState<Phase>(() => {
    if (initialDraftId) return 'checking'
    if (showDetailsStep) return 'details'
    return 'confirm'
  })
  const [draftId, setDraftId] = useState<string | null>(initialDraftId)
  const [formValues, setFormValues] = useState<Record<string, string>>(formDefaults)
  const [verificationReason, setVerificationReason] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [signature, setSignature] = useState('')
  const [method, setMethod] = useState<'draw' | 'type'>('draw')
  const [consent, setConsent] = useState(false)
  const [consentTimestamp, setConsentTimestamp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [redirectingToDidit, setRedirectingToDidit] = useState(false)

  const hasPdfBundle = documents.length > 0
  const flowSteps = buildFlowSteps(showDetailsStep, requireDiditVerification)

  const pollVerification = useCallback(
    async (activeDraftId: string) => {
      const res = await fetch('/api/portal/contracts/didit/status', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: activeDraftId }),
      })
      if (!res.ok) throw new Error('Could not check verification status')
      return res.json() as Promise<{
        status: 'Approved' | 'Declined' | 'Pending' | 'Expired'
        reason?: string
        formValues?: Record<string, string>
      }>
    },
    [],
  )

  useEffect(() => {
    if (phase !== 'checking' || !draftId) return

    let cancelled = false
    let attempts = 0

    const poll = async () => {
      if (cancelled) return
      attempts++

      try {
        const result = await pollVerification(draftId)
        if (cancelled) return

        if (result.status === 'Approved') {
          if (result.formValues) setFormValues(result.formValues as Record<string, string>)
          setPhase('review')
          router.replace(`/contracts/${contractId}/sign`)
          return
        }

        if (result.status === 'Declined' || result.status === 'Expired') {
          setVerificationReason(result.reason || 'Identity verification was not successful.')
          setPhase('declined')
          return
        }

        if (attempts < 20) {
          setTimeout(poll, 3000)
        } else {
          setVerificationReason('Didit is still processing your verification. Please wait a moment, then try again.')
          setPhase('declined')
        }
      } catch {
        if (!cancelled && attempts < 20) {
          setTimeout(poll, 3000)
        } else if (!cancelled) {
          setVerificationReason('We could not confirm your verification status yet. Please try again.')
          setPhase('declined')
        }
      }
    }

    const timer = setTimeout(poll, 2000)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [phase, draftId, pollVerification, contractId, router])

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true)
    setError('')
    try {
      const res = await fetch('/api/portal/contracts/preview', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, formValues }),
      })
      if (!res.ok) throw new Error('Could not generate contract preview')
      const blob = await res.blob()
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(blob)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setPreviewLoading(false)
    }
  }, [contractId, formValues])

  useEffect(() => {
    if (phase !== 'review') return
    loadPreview()
    return () => {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [phase, loadPreview])

  async function startDiditVerification() {
    if (!draftId) {
      setError('Please confirm your details before identity verification.')
      return
    }
    setRedirectingToDidit(true)
    setError('')
    try {
      const res = await fetch('/api/portal/contracts/didit/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, formValues, draftId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start identity verification')

      setDraftId(String(data.draftId))
      window.location.href = data.sessionUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setRedirectingToDidit(false)
    }
  }

  async function handleConfirmDetails() {
    setConfirmLoading(true)
    setError('')
    try {
      const res = await fetch('/api/portal/contracts/confirm-details', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          formValues,
          summarySnapshot: onboardingSummary,
          confirmedAt: new Date().toISOString(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; draftId?: string | number }
      if (!res.ok) {
        throw new Error(signErrorMessage(data.error || 'confirmation_failed'))
      }
      setDraftId(String(data.draftId))
      setPhase(requireDiditVerification ? 'verify' : 'review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save confirmation')
    } finally {
      setConfirmLoading(false)
    }
  }

  async function handleSign() {
    if (!signature || !consent || !consentTimestamp) {
      setError('Please sign and accept the consent statement')
      return
    }
    if (!draftId) {
      setError('Please confirm your onboarding details before signing')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/portal/contracts/sign', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          signatureDataUrl: signature,
          signatureMethod: method,
          consentAccepted: true,
          consentTimestamp,
          formValues,
          draftId,
        }),
      })
      if (!res.ok) throw new Error(await readSignError(res))
      router.push(`/contracts/${contractId}/completed`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signing failed')
    } finally {
      setLoading(false)
    }
  }

  if (phase === 'details') {
    return (
      <div>
        <ContractFlowStepper steps={flowSteps} current="details" />
        <ContractDetailsForm
          fields={formFields}
          defaultValues={formDefaults}
          finalButtonLabel="Continue to confirmation"
          onComplete={async (values) => {
            setFormValues(values)
            try {
              await fetch('/api/portal/contracts/profile-sync', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formValues: values }),
              })
            } catch {
              // Profile sync is best-effort; form values remain in session for signing.
            }
            setPhase('confirm')
          }}
        />
      </div>
    )
  }

  if (phase === 'confirm') {
    return (
      <div>
        <ContractFlowStepper steps={flowSteps} current="confirm" />
        <ContractOnboardingConfirmation
          summary={onboardingSummary}
          gate={confirmationGate}
          loading={confirmLoading}
          error={error}
          showBack={showDetailsStep}
          onBack={() => setPhase('details')}
          onConfirm={handleConfirmDetails}
        />
      </div>
    )
  }

  if (phase === 'verify') {
    return (
      <div className="space-y-6 max-w-2xl">
        <ContractFlowStepper steps={flowSteps} current="verify" />
        <div>
          <h2 className="text-xl font-semibold text-primary-800">Verify your identity</h2>
          <p className="text-sm text-[var(--cmd-text-muted)] mt-1">
            Before you sign, we need to confirm your identity with a quick selfie and liveness check via Didit — the
            same process used for participant enrolment.
          </p>
        </div>

        <div className="rounded-xl border border-[rgba(62,106,225,0.35)] bg-[rgba(62,106,225,0.1)] p-6 space-y-3 text-sm text-[var(--cmd-text)]">
          {!diditConfigured && (
            <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Didit is not configured on this server yet. Set DIDIT_API_KEY and DIDIT_WORKFLOW_ID to enable live
              verification.
            </p>
          )}
          <p>You will need:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>A valid Australian mobile number ({formValues.mobile || 'from your details'})</li>
            <li>Your phone camera for a selfie</li>
            <li>Good lighting and a few minutes uninterrupted</li>
          </ul>
        </div>

        <div className="flex justify-between gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPhase(showDetailsStep ? 'details' : 'confirm')}
          >
            Back
          </Button>
          <div className="flex gap-2">
            {!diditConfigured && (
              <Button type="button" variant="outline" onClick={() => setPhase('review')}>
                Continue to review
              </Button>
            )}
            <Button type="button" onClick={startDiditVerification} disabled={redirectingToDidit || !diditConfigured}>
              {redirectingToDidit ? 'Redirecting to Didit…' : 'Verify my identity'}
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (phase === 'checking') {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-[var(--cmd-border)] border-t-primary-600 animate-spin mx-auto" />
        <h2 className="text-lg font-semibold text-[var(--cmd-text)]">Checking identity verification</h2>
        <p className="text-sm text-[var(--cmd-text-muted)]">Please wait while we confirm your Didit verification…</p>
      </div>
    )
  }

  if (phase === 'declined') {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900">Verification not complete</h2>
          <p className="text-sm text-red-800 mt-2">{verificationReason}</p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPhase(showDetailsStep ? 'details' : 'confirm')}
          >
            Edit details
          </Button>
          <Button type="button" onClick={() => setPhase('verify')}>
            Try verification again
          </Button>
        </div>
      </div>
    )
  }

  const canSubmit = consent && signature && !loading

  return (
    <div className="space-y-6">
      <ContractFlowStepper steps={flowSteps} current="review" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--cmd-text)]">Review & sign</h2>
          <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">
            Preview your complete onboarding package below. Your signature will be applied to your
            contract and all onboarding declarations when you sign.
            {requireDiditVerification ? ' Identity verification is complete.' : ''}
          </p>
        </div>
        {showDetailsStep && (
          <Button type="button" variant="outline" onClick={() => setPhase('details')}>
            Edit details
          </Button>
        )}
        <Button type="button" variant="outline" onClick={() => setPhase('confirm')}>
          Review your details
        </Button>
      </div>

      {requireDiditVerification && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Identity verification complete via Didit.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        <div className="border border-[var(--cmd-border)] rounded-2xl overflow-hidden flex flex-col bg-[var(--cmd-surface-raised)] shadow-sm min-h-[480px]">
          <div className="bg-primary-800 px-5 py-3 w-full flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">{title}</p>
              <p className="text-primary-200 text-xs">Financial Literacy Australia</p>
            </div>
            <div className="flex items-center gap-2">
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-100 hover:text-white underline"
                >
                  Open full screen
                </a>
              )}
              {hasPdfBundle && <span className="text-primary-100 text-xs">{documents.length} docs</span>}
            </div>
          </div>

          <div className="w-full h-[420px] sm:h-[520px] lg:h-[calc(100vh-280px)] lg:min-h-[520px] border-b border-[var(--cmd-border)] relative bg-[var(--cmd-surface)]">
            {previewLoading && (
              <div className="absolute inset-0 flex items-center justify-center gap-3 text-[var(--cmd-text-muted)] bg-[var(--cmd-surface)]/80 z-10">
                <div className="h-5 w-5 rounded-full border-2 border-[var(--cmd-border)] border-t-primary-600 animate-spin" />
                <span className="text-sm">Preparing your contract…</span>
              </div>
            )}
            {previewUrl ? (
              <object data={`${previewUrl}#view=FitH&toolbar=0`} type="application/pdf" className="w-full h-full">
                <iframe title={`Preview ${title}`} src={previewUrl} className="w-full h-full" />
              </object>
            ) : !previewLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--cmd-text-muted)] text-sm">
                <p className="mb-3">Could not load preview.</p>
                <Button type="button" variant="outline" onClick={loadPreview}>
                  Retry preview
                </Button>
              </div>
            ) : null}
          </div>

          {hasPdfBundle && (
            <div className="px-5 py-3 bg-[var(--cmd-surface)] border-t border-[var(--cmd-border)]">
              <p className="text-xs font-medium text-[var(--cmd-text-muted)] mb-2">Included documents</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--cmd-text)]">
                {documents.map((doc) => (
                  <li key={doc.id}>{doc.label}</li>
                ))}
              </ol>
            </div>
          )}

          {!hasPdfBundle && bodyText && (
            <div className="px-5 py-3 bg-[var(--cmd-surface)] border-t border-[var(--cmd-border)] text-sm text-[var(--cmd-text-muted)]">{bodyText}</div>
          )}
        </div>

        <PortalCard title="Sign agreement" description="By signing you agree to the terms in the document preview." className="lg:sticky lg:top-24">
          <div className="space-y-4">
            <div className="bg-[rgba(62,106,225,0.1)] border border-[rgba(62,106,225,0.35)] rounded-xl p-4">
              <Checkbox
                id="consent"
                label={E_SIGN_CONSENT_TEXT}
                checked={consent}
                onChange={(e) => {
                  const checked = e.target.checked
                  setConsent(checked)
                  if (checked) setConsentTimestamp(new Date().toISOString())
                  else setConsentTimestamp('')
                }}
              />
            </div>

            <div>
              <p className="block text-sm font-medium text-[var(--cmd-text)] mb-2">Your signature</p>
              <SignaturePad
                onSignatureChange={(data, m) => {
                  setSignature(data)
                  setMethod(m)
                }}
                error={error && !signature ? error : undefined}
              />
              {signature && (
                <div className="mt-3 rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-3">
                  <p className="text-xs font-medium text-[var(--cmd-text-muted)] mb-2">Signature preview</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signature} alt="Your signature" className="max-h-16 max-w-full object-contain" />
                </div>
              )}
            </div>

            <Button className="w-full py-3" onClick={handleSign} disabled={!canSubmit}>
              {loading ? 'Signing…' : hasPdfBundle ? 'Sign & merge documents' : 'Sign contract'}
            </Button>

            {!canSubmit && !loading && (
              <p className="text-center text-xs text-[var(--cmd-text-muted)]">
                {!consent ? 'Accept the consent statement to continue' : 'Add your signature above'}
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </PortalCard>
      </div>
    </div>
  )
}
