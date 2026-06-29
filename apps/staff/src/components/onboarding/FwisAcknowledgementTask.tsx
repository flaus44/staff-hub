'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@flaus/ui-forms/Button'
import { Checkbox } from '@flaus/ui-forms/Checkbox'

export function FwisAcknowledgementTask({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [fwisAcknowledged, setFwisAcknowledged] = useState(false)
  const [ceisAcknowledged, setCeisAcknowledged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!fwisAcknowledged || !ceisAcknowledged) {
      setError('Please acknowledge both the FWIS and CEIS statements.')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/onboarding/tasks/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        taskId,
        status: 'complete',
        updates: { fwisAcknowledged: true, ceisAcknowledged: true },
      }),
    })

    if (!res.ok) {
      let errorMessage = ''
      try {
        const payload = (await res.json()) as { error?: unknown }
        if (typeof payload.error === 'string') {
          errorMessage = payload.error
        }
      } catch {
        const bodyText = await res.text().catch(() => '')
        if (bodyText) errorMessage = bodyText
      }
      if (!errorMessage && process.env.NODE_ENV === 'development') {
        errorMessage = `Request failed with status ${res.status}`
      }
      setError(errorMessage || 'Unable to save acknowledgement.')
      setLoading(false)
      return
    }

    const payload = (await res.json().catch(() => ({}))) as { generatedDocumentIds?: string[] }
    const params = new URLSearchParams({ success: '1' })
    for (const docId of payload.generatedDocumentIds ?? []) {
      params.append('doc', String(docId))
    }
    router.push(`/onboarding/tasks/fwis?${params.toString()}`)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="cmd-section-hub rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-4">
        <h3 className="cmd-section-title">Official statements</h3>
        <div className="space-y-4">
          <p className="text-sm text-[var(--cmd-text-muted)]">
            Please review the official statements shown below and acknowledge receipt to continue.
          </p>
          <p className="text-base font-medium text-[var(--cmd-text-muted)]">
            We recommend downloading a copy
          </p>
        </div>
      </div>

      <p className="text-xs text-[var(--cmd-text-muted)]">
        Signed copies of these statements will be included in your onboarding package when you sign
        your employment contract.
      </p>
      <section className="space-y-4">
        <article className="overflow-hidden rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)]">
          <div className="border-b border-[var(--cmd-border)] px-4 py-3">
            <h4 className="text-sm font-semibold text-[var(--cmd-text)]">
              Fair Work Information Statement (FWIS)
            </h4>
          </div>
          <iframe
            src="/api/portal/onboarding/statement-pdf?type=fwis"
            title="Fair Work Information Statement PDF"
            className="h-[60vh] min-h-[360px] w-full bg-white md:h-[70vh]"
          />
        </article>
        <article className="overflow-hidden rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)]">
          <div className="border-b border-[var(--cmd-border)] px-4 py-3">
            <h4 className="text-sm font-semibold text-[var(--cmd-text)]">
              Casual Employment Information Statement (CEIS)
            </h4>
          </div>
          <iframe
            src="/api/portal/onboarding/statement-pdf?type=ceis"
            title="Casual Employment Information Statement PDF"
            className="h-[60vh] min-h-[360px] w-full bg-white md:h-[70vh]"
          />
        </article>
      </section>
      <Checkbox
        id="fwis-ack"
        label="I acknowledge receipt of the Fair Work Information Statement (FWIS) shown above."
        checked={fwisAcknowledged}
        onChange={(event) => setFwisAcknowledged(event.target.checked)}
      />
      <Checkbox
        id="ceis-ack"
        label="I acknowledge receipt of the Casual Employment Information Statement (CEIS) shown above."
        checked={ceisAcknowledged}
        onChange={(event) => setCeisAcknowledged(event.target.checked)}
      />
      {error ? <p className="text-sm text-[var(--cmd-critical)]">{error}</p> : null}
      <Button onClick={() => submit()} disabled={loading}>
        {loading ? 'Saving…' : 'Acknowledge statement'}
      </Button>
    </div>
  )
}
