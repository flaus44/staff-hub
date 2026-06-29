'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@flaus/ui-forms/Button'
import { Checkbox } from '@flaus/ui-forms/Checkbox'
import { Input } from '@flaus/ui-forms/Input'
import { Select } from '@flaus/ui-forms/Select'
import { OfficialFormReviewPanel } from '@/components/onboarding/OfficialFormReviewPanel'

type PreviewForm = {
  formId: 'nat3092' | 'nat3093'
  title: string
  contentHash: string
  blobUrl: string
}

export function TaxTask({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [stale, setStale] = useState(false)
  const [previews, setPreviews] = useState<PreviewForm[]>([])
  const [verified, setVerified] = useState<Record<'nat3092' | 'nat3093', boolean>>({
    nat3092: false,
    nat3093: false,
  })
  const errorMessages: Record<string, string> = {
    invalid_tfn: 'Please enter your Tax File Number.',
    title_required: 'Please complete your profile and select your title before reviewing tax forms.',
    profile_incomplete_for_tax: 'Please complete your profile details before finishing tax setup.',
    forms_verification_required: 'Please review both forms and tick both verification checkboxes.',
    preview_stale: 'Your details changed. Please regenerate and review your forms again.',
  }

  const [form, setForm] = useState({
    tfn: '',
    claimTaxFreeThreshold: true,
    hasHelpDebt: false,
    hasSslDebt: false,
    hasTslDebt: false,
    hasVslDebt: false,
    hasSfssDebt: false,
    medicareExemption: 'none',
    residencyStatus: 'australian_resident',
  })

  useEffect(() => {
    return () => {
      for (const preview of previews) {
        URL.revokeObjectURL(preview.blobUrl)
      }
    }
  }, [previews])

  function markDraftChanged() {
    if (previews.length > 0) {
      setStale(true)
      setVerified({ nat3092: false, nat3093: false })
    }
  }

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    markDraftChanged()
  }

  const canSubmit = useMemo(() => {
    return (
      !loading
      && previews.length === 2
      && !stale
      && verified.nat3092
      && verified.nat3093
      && !previewLoading
    )
  }, [loading, previews.length, stale, verified, previewLoading])

  async function reviewForms() {
    setPreviewLoading(true)
    setPreviewError('')
    setError('')
    try {
      const res = await fetch('/api/portal/onboarding/forms/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          taskId,
          updates: form,
        }),
      })
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string
        previews?: Array<{ formId: 'nat3092' | 'nat3093'; title: string; contentHash: string; pdfBase64: string }>
      }
      if (!res.ok) {
        setPreviewError(errorMessages[String(payload.error ?? '')] || 'Unable to generate official form preview.')
        return
      }
      for (const preview of previews) {
        URL.revokeObjectURL(preview.blobUrl)
      }
      const nextPreviews = (payload.previews ?? []).map((preview) => {
        const bytes = Uint8Array.from(atob(preview.pdfBase64), (char) => char.charCodeAt(0))
        const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
        return {
          formId: preview.formId,
          title: preview.title,
          contentHash: preview.contentHash,
          blobUrl,
        }
      })
      setPreviews(nextPreviews)
      setStale(false)
      setVerified({ nat3092: false, nat3093: false })
    } finally {
      setPreviewLoading(false)
    }
  }

  async function submit() {
    setLoading(true)
    setError('')
    if (!form.tfn.trim()) {
      setError('Please enter your Tax File Number.')
      setLoading(false)
      return
    }
    if (!canSubmit) {
      setError('Review both official forms and tick both verification checkboxes before submitting.')
      setLoading(false)
      return
    }

    const previewContentHashes = Object.fromEntries(
      previews.map((preview) => [preview.formId, preview.contentHash]),
    )
    const res = await fetch('/api/onboarding/tasks/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        taskId,
        status: 'complete',
        updates: {
          ...form,
          nat3092Verified: verified.nat3092,
          nat3093Verified: verified.nat3093,
          previewContentHashes,
        },
      }),
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      const code = typeof payload.error === 'string' ? payload.error : ''
      setError(errorMessages[code] || 'Unable to save tax details.')
      setLoading(false)
      return
    }

    const payload = (await res.json().catch(() => ({}))) as { generatedDocumentIds?: string[] }
    const params = new URLSearchParams({ success: '1' })
    for (const docId of payload.generatedDocumentIds ?? []) {
      params.append('doc', String(docId))
    }
    router.push(`/onboarding/tasks/tax?${params.toString()}`)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--cmd-text-muted)]">
        Complete tax details once in the portal. Your verified NAT 3092 and NAT 3093 forms will be
        included in your signed onboarding package when you sign your employment contract.
      </p>
      <Input
        id="tax-tfn"
        label="Tax File Number (TFN)"
        value={form.tfn}
        inputMode="numeric"
        autoComplete="off"
        onChange={(event) => updateForm('tfn', event.target.value)}
      />
      <p className="text-xs text-[var(--cmd-text-muted)]">
        Your TFN is required to generate your NAT 3092 declaration and is stored securely.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          id="tax-residency"
          label="Tax residency"
          value={form.residencyStatus}
          onChange={(event) => updateForm('residencyStatus', event.target.value)}
          options={[
            { value: 'australian_resident', label: 'Australian resident' },
            { value: 'foreign_resident', label: 'Foreign resident' },
            { value: 'working_holiday_maker', label: 'Working holiday maker' },
          ]}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Checkbox
          id="tax-free-threshold"
          label="Claim tax-free threshold"
          checked={form.claimTaxFreeThreshold}
          onChange={(event) => updateForm('claimTaxFreeThreshold', event.target.checked)}
        />
        <Checkbox
          id="help-debt"
          label="I have a HELP debt"
          checked={form.hasHelpDebt}
          onChange={(event) => updateForm('hasHelpDebt', event.target.checked)}
        />
        <Checkbox
          id="ssl-debt"
          label="I have an SSL debt"
          checked={form.hasSslDebt}
          onChange={(event) => updateForm('hasSslDebt', event.target.checked)}
        />
        <Checkbox
          id="tsl-debt"
          label="I have a TSL debt"
          checked={form.hasTslDebt}
          onChange={(event) => updateForm('hasTslDebt', event.target.checked)}
        />
        <Checkbox
          id="vsl-debt"
          label="I have a VSL debt"
          checked={form.hasVslDebt}
          onChange={(event) => updateForm('hasVslDebt', event.target.checked)}
        />
        <Checkbox
          id="sfss-debt"
          label="I have an SFSS debt"
          checked={form.hasSfssDebt}
          onChange={(event) => updateForm('hasSfssDebt', event.target.checked)}
        />
        <Select
          id="medicare-exempt"
          label="Medicare levy exemption type"
          value={form.medicareExemption}
          onChange={(event) => updateForm('medicareExemption', event.target.value)}
          options={[
            { value: 'none', label: 'None' },
            { value: 'single', label: 'Single' },
            { value: 'couple', label: 'Couple' },
            { value: 'illness', label: 'Illness' },
          ]}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => reviewForms()}
        disabled={previewLoading}
      >
        {previewLoading ? 'Generating preview…' : 'Review my forms'}
      </Button>
      <OfficialFormReviewPanel
        forms={previews.map((preview) => ({
          id: preview.formId,
          title: preview.title,
          verifyLabel: '',
          blobUrl: preview.blobUrl,
          verified: false,
        }))}
        loading={previewLoading}
        error={previewError}
        stale={stale}
        staleMessage="Your details changed — review your forms again."
        showVerification={false}
      />
      {previews.length === 2 && !previewLoading ? (
        <section className="space-y-3 rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] px-4 py-3">
          <h4 className="text-sm font-semibold text-[var(--cmd-text)]">Confirm your forms</h4>
          <Checkbox
            id="verify-nat3092"
            label="I confirm the details on my NAT 3092 are correct."
            checked={verified.nat3092}
            onChange={(event) => setVerified((prev) => ({ ...prev, nat3092: event.target.checked }))}
          />
          <Checkbox
            id="verify-nat3093"
            label="I confirm the details on my NAT 3093 are correct."
            checked={verified.nat3093}
            onChange={(event) => setVerified((prev) => ({ ...prev, nat3093: event.target.checked }))}
          />
        </section>
      ) : null}
      {error ? <p className="text-sm text-[var(--cmd-critical)]">{error}</p> : null}
      <Button onClick={() => submit()} disabled={!canSubmit}>
        {loading ? 'Saving…' : 'Complete tax task'}
      </Button>
    </div>
  )
}
