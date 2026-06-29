'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

import { AuthBrandPanel, AuthMobileHeader } from '@/components/AuthBrandPanel'
import { Button } from '@flaus/ui-forms/Button'
import { Input } from '@flaus/ui-forms/Input'

type MfaMode = 'authenticator' | 'recovery'

function MfaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const [mode, setMode] = useState<MfaMode>('authenticator')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = mode === 'recovery' ? '/api/mfa/verify-recovery' : '/api/mfa/verify'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: token.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error === 'invalid_mfa_token' ? 'Invalid code' : 'Verification failed')
      }
      router.push(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid authentication code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--cmd-bg)]">
      <AuthBrandPanel
        title="Secure sign-in"
        subtitle="Two-factor authentication keeps your account and participant data safe."
      />

      <div className="flex items-center justify-center p-6 md:p-12 bg-[var(--cmd-bg)]">
        <div className="w-full max-w-md">
          <AuthMobileHeader
            title="Two-factor authentication"
            subtitle="Verify your identity to continue to the staff portal."
          />

          <div className="portal-auth-card">
            <h2 className="hidden lg:block text-2xl font-semibold text-[var(--cmd-text)] mb-1">
              Two-factor authentication
            </h2>
            <p className="text-sm text-[var(--cmd-text-muted)] mb-6">
              {mode === 'authenticator'
                ? 'Enter the 6-digit code from your authenticator app.'
                : 'Enter one of your backup recovery codes.'}
            </p>

            <div className="portal-auth-segment">
              <button
                type="button"
                onClick={() => {
                  setMode('authenticator')
                  setToken('')
                  setError('')
                }}
                className={`portal-auth-segment__btn ${mode === 'authenticator' ? 'portal-auth-segment__btn--active' : ''}`}
              >
                Authenticator
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('recovery')
                  setToken('')
                  setError('')
                }}
                className={`portal-auth-segment__btn ${mode === 'recovery' ? 'portal-auth-segment__btn--active' : ''}`}
              >
                Recovery code
              </button>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <Input
                id="token"
                label={mode === 'authenticator' ? 'Authentication code' : 'Recovery code'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                autoComplete="one-time-code"
                placeholder={mode === 'authenticator' ? '000000' : 'xxxxx-xxxxx'}
                className={mode === 'authenticator' ? 'text-center text-lg tracking-[0.3em] font-mono' : 'font-mono'}
              />
              {error && <p className="text-sm text-[var(--cmd-critical)]">{error}</p>}
              <Button type="submit" className="w-full py-3" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify'}
              </Button>
            </form>

            <p className="mt-4 text-xs text-[var(--cmd-text-muted)]">
              Having trouble? Contact your FLAUS administrator or IT support for help resetting MFA.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MfaVerifyPage() {
  return (
    <Suspense>
      <MfaForm />
    </Suspense>
  )
}
