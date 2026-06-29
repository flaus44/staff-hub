'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@flaus/ui-forms/Button'
import { Input } from '@flaus/ui-forms/Input'
import { Select } from '@flaus/ui-forms/Select'

export function RtwTask({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    citizenshipPath: '',
    visaSubclass: '',
    workRightsExpiry: '',
  })

  async function submit() {
    setLoading(true)
    setError('')
    if (!form.citizenshipPath) {
      setError('Select your citizenship or visa status.')
      setLoading(false)
      return
    }
    if (form.citizenshipPath === 'visa_holder' && !form.visaSubclass.trim()) {
      setError('Enter your visa subclass.')
      setLoading(false)
      return
    }
    if (form.citizenshipPath === 'visa_holder' && !form.workRightsExpiry) {
      setError('Enter your work rights expiry date.')
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
        updates: form,
      }),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      setError(payload.error || 'Unable to save right-to-work details.')
      setLoading(false)
      return
    }
    router.push('/onboarding/setup')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--cmd-text-muted)]">
        Provide right-to-work details for HR verification.
      </p>
      <Select
        id="rtw-citizenship"
        label="Citizenship or visa status"
        value={form.citizenshipPath}
        onChange={(event) => setForm((prev) => ({ ...prev, citizenshipPath: event.target.value }))}
        options={[
          { value: '', label: 'Select an option' },
          { value: 'australian_citizen', label: 'Australian citizen' },
          { value: 'permanent_resident', label: 'Permanent resident' },
          { value: 'visa_holder', label: 'Visa holder' },
        ]}
      />
      {form.citizenshipPath === 'visa_holder' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="rtw-visa-subclass"
            label="Visa subclass"
            value={form.visaSubclass}
            onChange={(event) => setForm((prev) => ({ ...prev, visaSubclass: event.target.value }))}
          />
          <Input
            id="rtw-work-rights-expiry"
            label="Work rights expiry"
            type="date"
            value={form.workRightsExpiry}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, workRightsExpiry: event.target.value }))
            }
          />
        </div>
      ) : null}
      {error ? <p className="text-sm text-[var(--cmd-critical)]">{error}</p> : null}
      <Button onClick={() => submit()} disabled={loading}>
        {loading ? 'Saving…' : 'Submit right-to-work details'}
      </Button>
    </div>
  )
}
