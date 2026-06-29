'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { DynamicSurveyForm, type SurveyField } from '@/components/DynamicSurveyForm'
import {
  CO_DESIGN_MODULE_TITLES,
  type CO_DESIGN_TRAINING_SLUGS,
} from '@/lib/session-capture-fields'
import { SESSION_CAPTURE_ATTESTATIONS } from '@/lib/survey-field'

type SessionCaptureFormClientProps = {
  assignmentId: string | number
  fields: SurveyField[]
  piiWarning?: boolean
  bannerText?: string
  submitLabel?: string
  isSessionCapture?: boolean
  initialAnswers?: Record<string, unknown>
  initialStep?: number
}

function titleForSlug(slug: string): string {
  if (slug in CO_DESIGN_MODULE_TITLES) {
    return CO_DESIGN_MODULE_TITLES[slug as (typeof CO_DESIGN_TRAINING_SLUGS)[number]]
  }
  return slug
}

export function SessionCaptureFormClient({
  assignmentId,
  fields,
  piiWarning,
  bannerText,
  submitLabel,
  isSessionCapture,
  initialAnswers,
  initialStep,
}: SessionCaptureFormClientProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [missingSlugs, setMissingSlugs] = useState<string[]>([])

  async function saveDraft(args: { answers: Record<string, unknown>; currentStep: number }) {
    await fetch('/api/portal/surveys/draft', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentId,
        answers: args.answers,
        currentStep: args.currentStep,
      }),
    })
  }

  async function submit(args: {
    answers: Record<string, unknown>
    attestations?: Record<string, boolean>
  }) {
    setError(null)
    setMissingSlugs([])
    const res = await fetch('/api/portal/surveys/submit', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentId,
        answers: args.answers,
        attestations: args.attestations,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (data.error === 'practice_capture_required') {
        setError('Complete your practice session capture first.')
        setMissingSlugs(['codesign-practice-capture'])
        return
      }
      if (
        data.error === 'training_incomplete' ||
        data.error === 'training_stale' ||
        (Array.isArray(data.missingSlugs) && data.missingSlugs.length > 0)
      ) {
        const slugs = Array.isArray(data.missingSlugs) ? (data.missingSlugs as string[]) : []
        setMissingSlugs(slugs)
        setError(
          data.error === 'training_stale'
            ? 'Some training modules were updated — please review them again in Toolbox.'
            : 'Finish these co-design training modules in Toolbox before submitting live captures.',
        )
        return
      }
      if (data.error === 'attestations_required') {
        setError('Please tick all checkboxes at the bottom of the form before saving.')
        return
      }
      if (data.error === 'pii_flags') {
        setError(
          'Please remove names, emails, or NDIS numbers from notes — use Section 8 for contact details only.',
        )
        return
      }
      setError('Could not submit. Check required fields and try again.')
      return
    }

    router.push('/surveys?submitted=1')
    router.refresh()
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          <p>{error}</p>
          {missingSlugs.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {missingSlugs.map((slug) => (
                <li key={slug}>
                  <Link href={`/training/${slug}`} className="font-medium underline">
                    {titleForSlug(slug)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <DynamicSurveyForm
        fields={fields}
        piiWarning={piiWarning}
        assignmentId={assignmentId}
        initialAnswers={initialAnswers}
        initialStep={initialStep}
        bannerText={bannerText}
        submitLabel={submitLabel ?? (isSessionCapture ? 'Save session' : 'Submit survey')}
        attestations={isSessionCapture ? SESSION_CAPTURE_ATTESTATIONS : []}
        onSaveDraft={saveDraft}
        onSubmit={submit}
      />
    </>
  )
}
