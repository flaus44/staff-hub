'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@flaus/ui-forms/Button'
import { Checkbox } from '@flaus/ui-forms/Checkbox'
import { Input } from '@flaus/ui-forms/Input'
import { Select } from '@flaus/ui-forms/Select'

import { NAT309_TITLE_EXPORTS } from '@/lib/onboarding-pdf/field-maps/nat3093-radio-values'

function dateInputValue(value?: string | null): string {
  if (!value) return ''
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value).trim())
  return match?.[1] ?? ''
}

type ProfileTitle = (typeof NAT309_TITLE_EXPORTS)[number]

type Mode = 'profile' | 'bank' | 'super' | 'fwis' | 'default'

type ProfileDefaults = {
  title?: string | null
  dateOfBirth?: string | null
  mobile?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  suburb?: string | null
  state?: string | null
  postcode?: string | null
  otherGivenNames?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContactRelationship?: string | null
}

export type { ProfileDefaults }

export function TaskCompletionForm({
  taskId,
  mode = 'default',
  profileDefaults,
}: {
  taskId: string
  mode?: Mode
  profileDefaults?: ProfileDefaults
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: (profileDefaults?.title ?? '') as ProfileTitle | '',
    dateOfBirth: dateInputValue(profileDefaults?.dateOfBirth),
    mobile: profileDefaults?.mobile ?? '',
    addressLine1: profileDefaults?.addressLine1 ?? '',
    addressLine2: profileDefaults?.addressLine2 ?? '',
    suburb: profileDefaults?.suburb ?? '',
    state: profileDefaults?.state ?? '',
    postcode: profileDefaults?.postcode ?? '',
    otherGivenNames: profileDefaults?.otherGivenNames ?? '',
    emergencyContactName: profileDefaults?.emergencyContactName ?? '',
    emergencyContactPhone: profileDefaults?.emergencyContactPhone ?? '',
    emergencyContactRelationship: profileDefaults?.emergencyContactRelationship ?? '',
    bankAccountName: '',
    bankBsb: '',
    bankAccountNumber: '',
    citizenshipPath: '',
    visaSubclass: '',
    workRightsExpiry: '',
    fwisWorkRightsConfirmed: false,
    superFundName: '',
    superFundId: '',
    superMemberNumber: '',
    superUseDefaultFund: false,
  })

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const updates: Record<string, unknown> = {}

      if (mode === 'profile') {
        if (!form.title) {
          setError('Please select your title.')
          setLoading(false)
          return
        }
        if (!form.dateOfBirth) {
          setError('Please enter your date of birth.')
          setLoading(false)
          return
        }
        if (
          !form.mobile.trim() ||
          !form.addressLine1.trim() ||
          !form.suburb.trim() ||
          !form.state.trim() ||
          !form.postcode.trim()
        ) {
          setError('Please complete your contact and address details.')
          setLoading(false)
          return
        }
        if (
          !form.emergencyContactName.trim() ||
          !form.emergencyContactPhone.trim() ||
          !form.emergencyContactRelationship.trim()
        ) {
          setError('Please complete all emergency contact fields.')
          setLoading(false)
          return
        }

        updates.profile = {
          title: form.title,
          dateOfBirth: form.dateOfBirth,
          mobile: form.mobile.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim() || undefined,
          suburb: form.suburb.trim(),
          state: form.state.trim(),
          postcode: form.postcode.trim(),
          otherGivenNames: form.otherGivenNames.trim() || undefined,
          emergencyContactName: form.emergencyContactName.trim(),
          emergencyContactPhone: form.emergencyContactPhone.trim(),
          emergencyContactRelationship: form.emergencyContactRelationship.trim(),
        }
      }

      if (mode === 'bank') {
        updates.bankAccountName = form.bankAccountName || undefined
        updates.bankBsb = form.bankBsb || undefined
        updates.bankAccountNumber = form.bankAccountNumber || undefined
      }

      if (mode === 'super') {
        const useDefault = form.superUseDefaultFund
        const fundName = form.superFundName.trim()
        const fundId = form.superFundId.trim()
        const memberNumber = form.superMemberNumber.trim()
        const hasManualDetails = Boolean(fundName || fundId || memberNumber)

        if (useDefault && hasManualDetails) {
          setError('Choose either your own super fund details or the default fund, not both.')
          setLoading(false)
          return
        }
        if (!useDefault && !hasManualDetails) {
          setError('Enter your super fund details or select the default super fund.')
          setLoading(false)
          return
        }
        if (!useDefault && (!fundName || !fundId || !memberNumber)) {
          setError('Please enter your super fund provider, fund ID, and member number.')
          setLoading(false)
          return
        }

        updates.superChoiceStatus = 'submitted'
        updates.superUseDefaultFund = useDefault
        updates.superFundName = useDefault ? null : fundName
        updates.superFundId = useDefault ? null : fundId
        updates.superMemberNumber = useDefault ? null : memberNumber
      }

      if (mode === 'fwis') {
        if (!form.fwisWorkRightsConfirmed) {
          setError('Please confirm your work rights details before submitting.')
          setLoading(false)
          return
        }
        if (!form.citizenshipPath) {
          setError('Please select your citizenship or visa status.')
          setLoading(false)
          return
        }
        if (form.citizenshipPath === 'visa_holder' && !form.visaSubclass.trim()) {
          setError('Please enter your visa subclass.')
          setLoading(false)
          return
        }
        if (form.citizenshipPath === 'visa_holder' && !form.workRightsExpiry) {
          setError('Please add your work rights expiry date.')
          setLoading(false)
          return
        }
        updates.rtwStatus = 'submitted'
        updates.citizenshipPath = form.citizenshipPath
        updates.visaSubclass =
          form.citizenshipPath === 'visa_holder' ? form.visaSubclass.trim() : null
        updates.workRightsExpiry =
          form.citizenshipPath === 'visa_holder' ? form.workRightsExpiry : null
      }

      const res = await fetch('/api/onboarding/tasks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          taskId,
          status: 'complete',
          updates,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        const serverError = String(payload.error ?? '')
        const errorMessages: Record<string, string> = {
          profile_incomplete: 'Please complete all required profile fields before saving.',
          title_required: 'Please select your title.',
        }
        setError(errorMessages[serverError] || payload.error || 'Unable to update task.')
        setLoading(false)
        return
      }

      router.push('/onboarding/setup')
      router.refresh()
    } catch {
      setError('Unable to update task.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {mode === 'profile' ? (
        <div className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--cmd-text)]">
              What is your title? <span className="text-[var(--cmd-critical)]">*</span>
            </legend>
            <div className="flex flex-wrap gap-4">
              {NAT309_TITLE_EXPORTS.map((title) => (
                <label key={title} className="flex items-center gap-2 text-sm text-[var(--cmd-text)]">
                  <input
                    type="radio"
                    name="profile-title"
                    value={title}
                    checked={form.title === title}
                    onChange={() => setForm((prev) => ({ ...prev, title }))}
                    className="h-4 w-4 accent-[var(--cmd-accent)]"
                  />
                  {title}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
          <Input id="dob" label="Date of birth" type="date" required value={form.dateOfBirth} onChange={(event) => setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} />
          <Input id="mobile" label="Mobile" required value={form.mobile} onChange={(event) => setForm((prev) => ({ ...prev, mobile: event.target.value }))} />
          <Input id="address" label="Address" required value={form.addressLine1} onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))} />
          <Input id="address-line-2" label="Address line 2 (optional)" value={form.addressLine2} onChange={(event) => setForm((prev) => ({ ...prev, addressLine2: event.target.value }))} />
          <Input id="suburb" label="Suburb" required value={form.suburb} onChange={(event) => setForm((prev) => ({ ...prev, suburb: event.target.value }))} />
          <Input id="state" label="State" required value={form.state} onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} />
          <Input id="postcode" label="Postcode" required value={form.postcode} onChange={(event) => setForm((prev) => ({ ...prev, postcode: event.target.value }))} />
          <Input id="other-given-names" label="Other given names (optional)" value={form.otherGivenNames} onChange={(event) => setForm((prev) => ({ ...prev, otherGivenNames: event.target.value }))} />
          <Input id="emergency-contact-name" label="Emergency contact name" required value={form.emergencyContactName} onChange={(event) => setForm((prev) => ({ ...prev, emergencyContactName: event.target.value }))} />
          <Input id="emergency-contact-phone" label="Emergency contact phone number" required value={form.emergencyContactPhone} onChange={(event) => setForm((prev) => ({ ...prev, emergencyContactPhone: event.target.value }))} />
          <Input id="emergency-contact-relationship" label="Relationship (to employee)" required value={form.emergencyContactRelationship} onChange={(event) => setForm((prev) => ({ ...prev, emergencyContactRelationship: event.target.value }))} />
          </div>
        </div>
      ) : null}

      {mode === 'bank' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input id="bank-name" label="Account name" value={form.bankAccountName} onChange={(event) => setForm((prev) => ({ ...prev, bankAccountName: event.target.value }))} />
          <Input id="bank-bsb" label="BSB" value={form.bankBsb} onChange={(event) => setForm((prev) => ({ ...prev, bankBsb: event.target.value }))} />
          <Input id="bank-number" label="Account number" value={form.bankAccountNumber} onChange={(event) => setForm((prev) => ({ ...prev, bankAccountNumber: event.target.value }))} />
        </div>
      ) : null}

      {mode === 'super' ? (
        <div className="space-y-3 rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-3">
          <p className="text-sm font-medium text-[var(--cmd-text)]">
            Choose your superannuation fund
          </p>
          <p className="py-5 text-sm text-[var(--cmd-text-muted)]">
            Nominate your existing super fund, or use the employer&apos;s default fund if you do not
            have one.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              id="super-fund-name"
              label="Superannuation provider"
              value={form.superFundName}
              disabled={form.superUseDefaultFund}
              onChange={(event) => {
                const value = event.target.value
                setForm((prev) => ({
                  ...prev,
                  superFundName: value,
                  superUseDefaultFund: value.trim() ? false : prev.superUseDefaultFund,
                }))
              }}
            />
            <Input
              id="super-fund-id"
              label="Superannuation fund ID"
              value={form.superFundId}
              disabled={form.superUseDefaultFund}
              onChange={(event) => {
                const value = event.target.value
                setForm((prev) => ({
                  ...prev,
                  superFundId: value,
                  superUseDefaultFund: value.trim() ? false : prev.superUseDefaultFund,
                }))
              }}
            />
            <Input
              id="super-member-number"
              label="Member number"
              value={form.superMemberNumber}
              disabled={form.superUseDefaultFund}
              onChange={(event) => {
                const value = event.target.value
                setForm((prev) => ({
                  ...prev,
                  superMemberNumber: value,
                  superUseDefaultFund: value.trim() ? false : prev.superUseDefaultFund,
                }))
              }}
            />
          </div>
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
          <Checkbox
            id="super-use-default"
            label="Use default super fund"
            checked={form.superUseDefaultFund}
            onChange={(event) => {
              const checked = event.target.checked
              setForm((prev) => ({
                ...prev,
                superUseDefaultFund: checked,
                superFundName: checked ? '' : prev.superFundName,
                superFundId: checked ? '' : prev.superFundId,
                superMemberNumber: checked ? '' : prev.superMemberNumber,
              }))
            }}
          />
        </div>
      ) : null}

      {mode === 'fwis' ? (
        <div className="space-y-3 rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-3">
          <p className="text-sm font-medium text-[var(--cmd-text)]">
            Confirm your work rights in Australia
          </p>
          <Select
            id="citizenship-path"
            label="Citizenship or visa status"
            value={form.citizenshipPath}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, citizenshipPath: event.target.value }))
            }
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
                id="visa-subclass"
                label="Visa subclass"
                value={form.visaSubclass}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, visaSubclass: event.target.value }))
                }
              />
              <Input
                id="work-rights-expiry"
                label="Work rights expiry"
                type="date"
                value={form.workRightsExpiry}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, workRightsExpiry: event.target.value }))
                }
              />
            </div>
          ) : null}
          <Checkbox
            id="fwis-work-rights-confirmed"
            label="I confirm I have valid work rights in Australia and these details are accurate."
            checked={form.fwisWorkRightsConfirmed}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, fwisWorkRightsConfirmed: event.target.checked }))
            }
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--cmd-critical)]">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => submit()} disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
