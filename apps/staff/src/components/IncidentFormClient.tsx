'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { StepIndicator } from '@flaus/ui-forms/StepIndicator'
import { Input } from '@flaus/ui-forms/Input'
import { TextArea } from '@flaus/ui-forms/TextArea'
import { Select } from '@flaus/ui-forms/Select'
import { Button } from '@flaus/ui-forms/Button'
import { Checkbox } from '@flaus/ui-forms/Checkbox'

type Witness = { name: string; contact: string; role: string }

export function IncidentFormClient() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    occurredAt: new Date().toISOString().slice(0, 16),
    location: '',
    category: 'near_miss',
    description: '',
    immediateActions: '',
    treatmentRequired: false,
    severity: 'low',
    piiAcknowledged: false,
  })
  const [witnesses, setWitnesses] = useState<Witness[]>([])
  const [error, setError] = useState<string | null>(null)

  function addWitness() {
    setWitnesses([...witnesses, { name: '', contact: '', role: '' }])
  }

  function updateWitness(index: number, field: keyof Witness, value: string) {
    setWitnesses(witnesses.map((w, i) => (i === index ? { ...w, [field]: value } : w)))
  }

  function removeWitness(index: number) {
    setWitnesses(witnesses.filter((_, i) => i !== index))
  }

  async function submit() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/incidents', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        status: 'submitted',
        witnesses: witnesses.filter((w) => w.name.trim()),
      }),
    })
    setLoading(false)
    if (res.ok) {
      const data = await res.json()
      const id = data.doc?.id ?? data.id
      router.push(id ? `/incidents/${id}/submitted` : '/incidents')
      router.refresh()
      return
    }
    try {
      const data = (await res.json()) as { errors?: Array<{ message?: string }>; message?: string }
      const msg =
        data.errors?.map((e) => e.message).filter(Boolean).join(', ') ||
        data.message ||
        `Could not submit incident (${res.status})`
      setError(msg)
    } catch {
      setError(`Could not submit incident (${res.status})`)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        If someone is injured, call <strong>000</strong> first.
      </div>
      <StepIndicator currentStep={step} totalSteps={3} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
          {error}
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4 bg-[var(--cmd-surface)] rounded-xl border p-6">
          <Input
            id="occurredAt"
            label="When did it happen?"
            type="datetime-local"
            value={form.occurredAt}
            onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
            required
          />
          <Input
            id="location"
            label="Where did it happen?"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          />
          <Select
            id="category"
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={[
              { value: 'injury', label: 'Injury' },
              { value: 'near_miss', label: 'Near miss' },
              { value: 'property', label: 'Property damage' },
              { value: 'psychosocial', label: 'Psychosocial' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Button type="button" onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4 bg-[var(--cmd-surface)] rounded-xl border p-6">
          <TextArea
            id="description"
            label="What happened?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <TextArea
            id="immediateActions"
            label="Immediate actions taken"
            value={form.immediateActions}
            onChange={(e) => setForm({ ...form, immediateActions: e.target.value })}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--cmd-text)]">Witnesses (optional)</p>
              <Button type="button" variant="outline" onClick={addWitness}>
                Add witness
              </Button>
            </div>
            {witnesses.map((w, i) => (
              <div key={i} className="rounded-lg border border-[var(--cmd-border)] p-3 space-y-2">
                <Input
                  id={`witness-name-${i}`}
                  label="Name"
                  value={w.name}
                  onChange={(e) => updateWitness(i, 'name', e.target.value)}
                />
                <Input
                  id={`witness-role-${i}`}
                  label="Role"
                  value={w.role}
                  onChange={(e) => updateWitness(i, 'role', e.target.value)}
                />
                <Input
                  id={`witness-contact-${i}`}
                  label="Contact"
                  value={w.contact}
                  onChange={(e) => updateWitness(i, 'contact', e.target.value)}
                />
                <Button type="button" variant="outline" onClick={() => removeWitness(i)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <Checkbox
            id="pii"
            label="I will not include participant names or NDIS numbers unless necessary"
            checked={form.piiAcknowledged}
            onChange={(e) => setForm({ ...form, piiAcknowledged: e.target.checked })}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(3)} disabled={!form.piiAcknowledged}>
              Continue
            </Button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4 bg-[var(--cmd-surface)] rounded-xl border p-6">
          <Select
            id="severity"
            label="Severity"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
          <Checkbox
            id="treatment"
            label="Treatment was required"
            checked={form.treatmentRequired}
            onChange={(e) => setForm({ ...form, treatmentRequired: e.target.checked })}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="button" onClick={submit} disabled={loading || !form.description}>
              {loading ? 'Submitting…' : 'Submit report'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
