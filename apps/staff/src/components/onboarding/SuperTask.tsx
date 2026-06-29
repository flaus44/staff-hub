'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@flaus/ui-forms/Button'
import { Checkbox } from '@flaus/ui-forms/Checkbox'
import { Input } from '@flaus/ui-forms/Input'
import { OfficialFormReviewPanel } from '@/components/onboarding/OfficialFormReviewPanel'

type SuperPreview = {
  formId: 'nat13080'
  title: string
  contentHash: string
  blobUrl: string
}

type ComplianceUpload = {
  documentId: string
  fileName: string
}

const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  file_required: 'Choose a PDF or image file to upload.',
  file_too_large: 'File is too large. Maximum size is 10 MB.',
  invalid_file_type: 'Upload a PDF or image file (JPEG, PNG, or WebP).',
}

function uploadErrorMessage(code: string | undefined, fallback: string): string {
  if (code && UPLOAD_ERROR_MESSAGES[code]) return UPLOAD_ERROR_MESSAGES[code]
  return fallback
}

export function SuperTask({
  taskId,
  existingComplianceLetter,
}: {
  taskId: string
  existingComplianceLetter?: ComplianceUpload
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [stale, setStale] = useState(false)
  const [preview, setPreview] = useState<SuperPreview | null>(null)
  const [verified, setVerified] = useState(false)
  const [complianceUpload, setComplianceUpload] = useState<ComplianceUpload | null>(
    existingComplianceLetter ?? null,
  )

  const [form, setForm] = useState({
    superUseDefaultFund: false,
    superUseSmsf: false,
    superFundName: '',
    superFundId: '',
    superMemberNumber: '',
    superFundAbn: '',
    smsfName: '',
    smsfAbn: '',
    smsfEsa: '',
    smsfBankName: '',
    smsfBsb: '',
    smsfAccountNumber: '',
  })

  const showComplianceLetterUpload = !form.superUseDefaultFund && !form.superUseSmsf

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.blobUrl)
    }
  }, [preview])

  function markDraftChanged() {
    if (preview) {
      setStale(true)
      setVerified(false)
    }
  }

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    markDraftChanged()
  }

  async function clearComplianceLetter() {
    if (!complianceUpload) return
    setUploadError('')
    try {
      await fetch(`/api/portal/onboarding/super/compliance-letter?taskId=${encodeURIComponent(taskId)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch {
      setUploadError('Unable to remove the uploaded letter. Please try again.')
      return
    }
    setComplianceUpload(null)
  }

  async function handleFundChoiceChange(
    choice: 'default' | 'smsf',
    checked: boolean,
  ) {
    if (checked && showComplianceLetterUpload) {
      await clearComplianceLetter()
    }
    setForm((prev) => {
      if (choice === 'default') {
        return {
          ...prev,
          superUseDefaultFund: checked,
          superUseSmsf: checked ? false : prev.superUseSmsf,
        }
      }
      return {
        ...prev,
        superUseSmsf: checked,
        superUseDefaultFund: checked ? false : prev.superUseDefaultFund,
      }
    })
    markDraftChanged()
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploading(true)
    setUploadError('')
    setError('')
    try {
      const formData = new FormData()
      formData.append('taskId', taskId)
      formData.append('file', file)

      const res = await fetch('/api/portal/onboarding/super/compliance-letter', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string
        documentId?: string
        fileName?: string
      }
      if (!res.ok) {
        setUploadError(
          uploadErrorMessage(payload.error, 'Unable to upload your letter of compliance.'),
        )
        return
      }
      if (!payload.documentId || !payload.fileName) {
        setUploadError('Upload completed but the server response was incomplete.')
        return
      }
      setComplianceUpload({
        documentId: String(payload.documentId),
        fileName: String(payload.fileName),
      })
    } finally {
      setUploading(false)
    }
  }

  const canReview = !previewLoading

  const canSubmit = useMemo(() => {
    return (
      !loading
      && !previewLoading
      && Boolean(preview)
      && verified
      && !stale
    )
  }, [loading, previewLoading, preview, verified, stale])

  async function reviewForm() {
    if (!canReview) return

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
        previews?: Array<{ formId: 'nat13080'; title: string; contentHash: string; pdfBase64: string }>
      }
      if (!res.ok) {
        setPreviewError(
          uploadErrorMessage(payload.error, 'Unable to generate official form preview.'),
        )
        return
      }
      const raw = payload.previews?.[0]
      if (!raw) {
        setPreviewError('No preview document was returned.')
        return
      }
      if (preview) URL.revokeObjectURL(preview.blobUrl)
      const bytes = Uint8Array.from(atob(raw.pdfBase64), (char) => char.charCodeAt(0))
      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
      setPreview({
        formId: raw.formId,
        title: raw.title,
        contentHash: raw.contentHash,
        blobUrl,
      })
      setVerified(false)
      setStale(false)
    } finally {
      setPreviewLoading(false)
    }
  }

  async function submit() {
    setLoading(true)
    setError('')
    if (!form.superUseDefaultFund && !form.superUseSmsf) {
      if (!form.superFundName.trim() || !form.superFundId.trim() || !form.superMemberNumber.trim()) {
        setError('Enter your super fund details, or choose default fund / SMSF.')
        setLoading(false)
        return
      }
    }
    if (!canSubmit || !preview) {
      setError('Review your NAT 13080 form and confirm details before submitting.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/onboarding/tasks/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        taskId,
        status: 'complete',
        updates: {
          ...form,
          nat13080Verified: verified,
          previewContentHashes: {
            nat13080: preview.contentHash,
          },
        },
      }),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      setError(
        uploadErrorMessage(
          typeof payload.error === 'string' ? payload.error : undefined,
          'Unable to save super details.',
        ),
      )
      setLoading(false)
      return
    }

    const payload = (await res.json().catch(() => ({}))) as { generatedDocumentIds?: string[] }
    const params = new URLSearchParams({ success: '1' })
    for (const docId of payload.generatedDocumentIds ?? []) {
      params.append('doc', String(docId))
    }
    router.push(`/onboarding/tasks/super?${params.toString()}`)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--cmd-text-muted)]">
        Complete super details and we will generate the official NAT 13080 form.
      </p>

      {!form.superUseDefaultFund && !form.superUseSmsf ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input id="fund-name" label="Fund name" value={form.superFundName} onChange={(event) => updateForm('superFundName', event.target.value)} />
          <Input id="fund-usi" label="Fund USI / ID" value={form.superFundId} onChange={(event) => updateForm('superFundId', event.target.value)} />
          <Input id="fund-abn" label="Fund ABN (optional)" value={form.superFundAbn} onChange={(event) => updateForm('superFundAbn', event.target.value)} />
          <Input id="member-number" label="Member number" value={form.superMemberNumber} onChange={(event) => updateForm('superMemberNumber', event.target.value)} />
        </div>
      ) : null}

      {showComplianceLetterUpload ? (
        <section className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4">
          <h3 className="text-sm font-semibold text-[var(--cmd-text)]">Letter of compliance</h3>
          <details className="mt-2 text-sm text-[var(--cmd-text-muted)]">
            <summary className="cursor-pointer font-medium text-[var(--cmd-text)]">
              How to get your letter of compliance
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                This is confirmation from your super fund that it is a complying fund and can receive
                employer contributions.
              </li>
              <li>
                Contact your super fund (member portal, app, or phone) and request a{' '}
                <strong>letter of compliance</strong> or <strong>employer contribution confirmation</strong>.
              </li>
              <li>
                Check your fund&apos;s website under &quot;Employers&quot; or &quot;Payroll&quot; /
                &quot;Contributions&quot;.
              </li>
              <li>
                If you are stuck, call your super fund&apos;s member services — they issue these
                routinely for payroll setup.
              </li>
              <li>
                You can verify fund name and USI at{' '}
                <a
                  className="text-[var(--cmd-accent)] underline"
                  href="https://superfundlookup.gov.au/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  ATO Super Fund Lookup
                </a>
                .
              </li>
            </ul>
          </details>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              id="super-compliance-letter"
              type="file"
              onChange={(event) => void handleFileSelect(event)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? 'Uploading…' : 'Choose file'}
            </Button>
            {complianceUpload ? (
              <span className="text-sm text-[var(--cmd-text)]">
                {complianceUpload.fileName}{' '}
                <span className="text-[var(--cmd-success)]">✓ Uploaded</span>
              </span>
            ) : (
              <span className="text-sm text-[var(--cmd-text-muted)]">No file uploaded yet</span>
            )}
            {complianceUpload ? (
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => void clearComplianceLetter()}
              >
                Remove
              </Button>
            ) : null}
          </div>
          {uploadError ? <p className="mt-2 text-sm text-[var(--cmd-critical)]">{uploadError}</p> : null}
        </section>
      ) : null}

      {!form.superUseSmsf && !form.superUseDefaultFund ? (
        <div
          className="flex items-center gap-3 py-2"
          role="separator"
          aria-label="or"
        >
          <div className="h-px flex-1 bg-[var(--cmd-border)]" />
          <span className="shrink-0 rounded-full border border-[var(--cmd-border)] bg-[var(--cmd-surface)] px-4 py-1 text-sm font-semibold uppercase tracking-wide text-[var(--cmd-text-muted)]">
            OR
          </span>
          <div className="h-px flex-1 bg-[var(--cmd-border)]" />
        </div>
      ) : null}

      <Checkbox
        id="use-default-super"
        label="Use employer default super fund"
        checked={form.superUseDefaultFund}
        onChange={(event) => void handleFundChoiceChange('default', event.target.checked)}
      />
      <Checkbox
        id="use-smsf"
        label="Use SMSF (self-managed super fund)"
        checked={form.superUseSmsf}
        onChange={(event) => void handleFundChoiceChange('smsf', event.target.checked)}
      />

      {form.superUseSmsf ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input id="smsf-name" label="SMSF name" value={form.smsfName} onChange={(event) => updateForm('smsfName', event.target.value)} />
          <Input id="smsf-abn" label="SMSF ABN" value={form.smsfAbn} onChange={(event) => updateForm('smsfAbn', event.target.value)} />
          <Input id="smsf-esa" label="SMSF ESA" value={form.smsfEsa} onChange={(event) => updateForm('smsfEsa', event.target.value)} />
          <Input id="smsf-bank" label="Bank name" value={form.smsfBankName} onChange={(event) => updateForm('smsfBankName', event.target.value)} />
          <Input id="smsf-bsb" label="BSB" value={form.smsfBsb} onChange={(event) => updateForm('smsfBsb', event.target.value)} />
          <Input id="smsf-account" label="Account number" value={form.smsfAccountNumber} onChange={(event) => updateForm('smsfAccountNumber', event.target.value)} />
        </div>
      ) : null}

      <Button
        type="button"
        className="!bg-[rgba(48,209,88,0.15)] !text-[var(--cmd-live)] hover:!bg-[rgba(48,209,88,0.22)] focus:!ring-[rgba(48,209,88,0.35)] !border-transparent"
        onClick={() => reviewForm()}
        disabled={!canReview}
      >
        {previewLoading ? 'Generating preview…' : 'Review my form'}
      </Button>
      <OfficialFormReviewPanel
        forms={
          preview
            ? [
                {
                  id: preview.formId,
                  title: preview.title,
                  verifyLabel: 'I confirm the details on my NAT 13080 are correct.',
                  blobUrl: preview.blobUrl,
                  verified,
                },
              ]
            : []
        }
        loading={previewLoading}
        error={previewError}
        stale={stale}
        staleMessage="Your details changed — review your form again."
        onToggleVerified={(_, checked) => setVerified(checked)}
      />
      {error ? <p className="text-sm text-[var(--cmd-critical)]">{error}</p> : null}
      <Button onClick={() => submit()} disabled={!canSubmit}>
        {loading ? 'Saving…' : 'Complete super task'}
      </Button>
    </div>
  )
}
