'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

import { Button } from '@flaus/ui-forms/Button'
import { Input } from '@flaus/ui-forms/Input'

import { AuthBrandPanel, AuthMobileHeader } from '@/components/AuthBrandPanel'

function LoginForm() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const inviteEmail = searchParams.get('email')
  const next = searchParams.get('next') || '/dashboard'

  const [email, setEmail] = useState(inviteEmail || '')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isInvite = Boolean(inviteToken)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isInvite) {
        const res = await fetch('/api/invite/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: inviteToken,
            email,
            password,
            firstName,
            lastName,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Invite failed')
        }
      }

      const loginRes = await fetch('/api/staff-users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!loginRes.ok) {
        let message = 'Invalid email or password'
        try {
          const data = (await loginRes.json()) as { message?: string; errors?: Array<{ message?: string }> }
          if (loginRes.status >= 500) {
            message =
              data.message?.includes('initializing Payload') || data.message?.includes('Payload')
                ? 'The server cannot reach the database. Start Docker Desktop, then run "docker compose up -d" from the staff-hub folder and refresh this page.'
                : data.message || 'Server error — try again in a moment.'
          } else if (data.errors?.length) {
            message = data.errors.map((err) => err.message).filter(Boolean).join('. ') || message
          } else if (data.message) {
            message = data.message
          }
        } catch {
          if (loginRes.status >= 500) {
            message =
              'The server cannot reach the database. Start Docker Desktop, then run "docker compose up -d" from the staff-hub folder.'
          }
        }
        throw new Error(message)
      }
      window.location.assign(next)
      return
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--cmd-bg)]">
      <AuthBrandPanel title={isInvite ? 'Welcome to FLAUS' : 'Staff Hub'} />

      <div className="flex items-center justify-center p-6 md:p-12 bg-[var(--cmd-bg)]">
        <div className="w-full max-w-md">
          <AuthMobileHeader
            title={isInvite ? 'Accept your invite' : 'Sign in'}
            subtitle={isInvite ? 'Set up your account to access the portal.' : 'Use your FLAUS staff email and password.'}
          />

          <div className="portal-auth-card">
            <h2 className="hidden lg:block text-2xl font-semibold text-[var(--cmd-text)] mb-6">
              {isInvite ? 'Accept your invite' : 'Sign in'}
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              {isInvite && (
                <>
                  <Input
                    id="firstName"
                    label="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    id="lastName"
                    label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </>
              )}
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-[var(--cmd-critical)]">{error}</p>}
              <Button type="submit" className="w-full py-3" disabled={loading}>
                {loading ? 'Please wait…' : isInvite ? 'Create account & sign in' : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
