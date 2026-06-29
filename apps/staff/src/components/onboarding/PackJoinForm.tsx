'use client'

import { useState } from 'react'

import { Button } from '@flaus/ui-forms/Button'
import { Input } from '@flaus/ui-forms/Input'

import { MIN_PASSWORD_LENGTH } from '@/lib/auth-password'

export function PackJoinForm({
  packSlug,
  packName,
}: {
  packSlug: string
  packName: string
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    setLoading(true)

    try {
      const joinRes = await fetch('/api/onboarding/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packSlug,
          email,
          password,
          firstName,
          lastName,
        }),
      })

      if (!joinRes.ok) {
        const data = await joinRes.json().catch(() => ({}))
        if (data.error === 'email_in_use') {
          throw new Error('An account with this email already exists. Sign in instead.')
        }
        if (data.error === 'pack_not_found') {
          throw new Error('This onboarding link is no longer available.')
        }
        if (data.error === 'invalid_input' || data.error === 'invalid_password') {
          throw new Error(
            data.message || `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
          )
        }
        if (data.error === 'provisioning_failed') {
          throw new Error('We could not set up your onboarding tasks. Please contact HR.')
        }
        const payloadMessage =
          typeof data.message === 'string'
            ? data.message
            : Array.isArray(data.errors) && data.errors[0]?.message
              ? String(data.errors[0].message)
              : null
        throw new Error(payloadMessage || 'Unable to start onboarding')
      }

      const loginRes = await fetch('/api/staff-users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (!loginRes.ok) {
        throw new Error('Account created but sign-in failed. Try signing in from the login page.')
      }

      window.location.assign('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-auth-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cmd-accent)]">
        {packName}
      </p>
      <h2 className="hidden lg:block text-2xl font-semibold text-[var(--cmd-text)] mb-1 mt-2">
        Start your onboarding
      </h2>
      <p className="text-sm text-[var(--cmd-text-muted)] mb-6">
        Create your FLAUS staff account to complete onboarding for this role.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="join-first-name"
            label="First name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <Input
            id="join-last-name"
            label="Last name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </div>
        <Input
          id="join-email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          id="join-password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
        />
        <p className="text-xs text-[var(--cmd-text-muted)]">
          Use at least {MIN_PASSWORD_LENGTH} characters.
        </p>
        {error ? <p className="text-sm text-[var(--cmd-critical)]">{error}</p> : null}
        <Button type="submit" className="w-full py-3" disabled={loading}>
          {loading ? 'Please wait…' : 'Create account & start onboarding'}
        </Button>
      </form>
      <p className="mt-4 text-xs text-[var(--cmd-text-muted)]">
        Already have an account? <a href="/login" className="text-[var(--cmd-accent)] hover:underline">Sign in</a>
      </p>
    </div>
  )
}
