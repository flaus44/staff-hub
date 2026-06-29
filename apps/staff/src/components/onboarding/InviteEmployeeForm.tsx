'use client'

import { useState } from 'react'

import { Button } from '@flaus/ui-forms/Button'
import { Input } from '@flaus/ui-forms/Input'
import { Select } from '@flaus/ui-forms/Select'

export function InviteEmployeeForm({
  packs,
}: {
  packs: Array<{ id: string; name: string }>
}) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('staff')
  const [packId, setPackId] = useState(packs[0]?.id ?? '')
  const [startDate, setStartDate] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  async function submit() {
    setResult('')
    setError('')
    const payload = {
      email,
      firstName,
      lastName,
      role,
      packId,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
    }
    const res = await fetch('/api/invite/create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Unable to create invite')
      return
    }
    const body = await res.json()
    setResult(String(body.inviteUrl ?? 'Invite created'))
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input id="invite-email" label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Select
          id="invite-role"
          label="Portal role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          options={[
            { value: 'staff', label: 'Staff' },
            { value: 'manager', label: 'Manager' },
          ]}
        />
        <Input id="invite-first-name" label="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        <Input id="invite-last-name" label="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
        <Select
          id="invite-pack"
          label="Onboarding pack"
          value={packId}
          onChange={(event) => setPackId(event.target.value)}
          options={packs.map((pack) => ({ value: pack.id, label: pack.name }))}
        />
        <Input id="invite-start-date" label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
      </div>
      {error ? <p className="text-sm text-[var(--cmd-critical)]">{error}</p> : null}
      {result ? (
        <p className="rounded-lg bg-[var(--cmd-surface-raised)] p-2 text-xs text-[var(--cmd-text-muted)] break-all">
          {result}
        </p>
      ) : null}
      <Button onClick={submit}>Create invite</Button>
    </div>
  )
}
