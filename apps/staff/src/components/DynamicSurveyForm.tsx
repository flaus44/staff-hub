'use client'

import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { StepIndicator } from '@flaus/ui-forms/StepIndicator'
import { Input } from '@flaus/ui-forms/Input'
import { TextArea } from '@flaus/ui-forms/TextArea'
import { Select } from '@flaus/ui-forms/Select'
import { Button } from '@flaus/ui-forms/Button'
import { Checkbox } from '@flaus/ui-forms/Checkbox'

import {
  SESSION_CAPTURE_ATTESTATIONS,
  visibleFields,
  visibleSteps,
  type SubmitAttestation,
  type SurveyField,
} from '@/lib/survey-field'

export type { SurveyField } from '@/lib/survey-field'

interface DynamicSurveyFormProps {
  fields: SurveyField[]
  piiWarning?: boolean
  assignmentId?: string | number
  initialAnswers?: Record<string, unknown>
  initialStep?: number
  submitLabel?: string
  bannerText?: string
  attestations?: SubmitAttestation[]
  onSaveDraft?: (args: {
    answers: Record<string, unknown>
    currentStep: number
  }) => Promise<void>
  onSubmit: (args: {
    answers: Record<string, unknown>
    attestations?: Record<string, boolean>
  }) => Promise<void>
}

function buildSchema(fields: SurveyField[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    if (field.type === 'script' || field.type === 'section') continue
    let schema: z.ZodTypeAny = z.string()
    if (field.type === 'number') schema = z.coerce.number()
    if (field.type === 'yesno') schema = z.enum(['yes', 'no'])
    if (field.type === 'multiselect') schema = z.array(z.string()).optional()
    if (!field.required) schema = schema.optional()
    else if (field.type !== 'number') schema = (schema as z.ZodString).min(1, 'Required')
    shape[field.id] = schema
  }
  return z.object(shape)
}

export function DynamicSurveyForm({
  fields,
  piiWarning,
  assignmentId,
  initialAnswers,
  initialStep = 0,
  submitLabel = 'Submit',
  bannerText,
  attestations = [],
  onSaveDraft,
  onSubmit,
}: DynamicSurveyFormProps) {
  const [stepIndex, setStepIndex] = useState(initialStep)
  const [attestationState, setAttestationState] = useState<Record<string, boolean>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const formSchema = useMemo(() => buildSchema(fields), [fields])
  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialAnswers,
  })

  const watched = useWatch({ control })
  const answers = (watched ?? {}) as Record<string, unknown>

  const steps = useMemo(() => visibleSteps(fields, answers), [fields, answers])
  const currentStepNumber = steps[stepIndex] ?? steps[0] ?? 1
  const stepFields = visibleFields(fields, answers).filter(
    (f) => (f.step ?? 1) === currentStepNumber,
  )
  const stepTitle = stepFields.find((f) => f.stepTitle)?.stepTitle
  const isLastStep = stepIndex >= steps.length - 1
  const showAttestations = isLastStep && attestations.length > 0
  const finalAttestations =
    attestations.length > 0 ? attestations : SESSION_CAPTURE_ATTESTATIONS

  const persistDraft = useCallback(async () => {
    if (!onSaveDraft || !assignmentId) return
    await onSaveDraft({ answers: getValues(), currentStep: stepIndex })
  }, [assignmentId, getValues, onSaveDraft, stepIndex])

  useEffect(() => {
    if (!onSaveDraft || !assignmentId) return
    const timer = setTimeout(() => {
      void persistDraft()
    }, 1500)
    return () => clearTimeout(timer)
  }, [answers, stepIndex, assignmentId, onSaveDraft, persistDraft])

  const submitAll = handleSubmit(async (data) => {
    setSubmitError(null)
    if (showAttestations) {
      for (const item of finalAttestations) {
        if (item.required && !attestationState[item.id]) {
          setSubmitError('Please tick all required confirmations before submitting.')
          return
        }
      }
    }
    await onSubmit({
      answers: data,
      attestations: showAttestations ? attestationState : undefined,
    })
  })

  const piiStep = stepFields.some((f) => f.fieldRole === 'contact_pii' || f.fieldRole === 'facilitator_note')

  return (
    <form onSubmit={submitAll} className="max-w-xl mx-auto pb-24">
      {bannerText && (
        <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
          {bannerText}
        </div>
      )}

      <StepIndicator currentStep={stepIndex + 1} totalSteps={steps.length} />

      {stepTitle && (
        <h2 className="mt-4 text-lg font-semibold text-slate-900">{stepTitle}</h2>
      )}

      {piiWarning && stepIndex === 0 && (
        <div className="mb-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Do not include participant names or NDIS numbers unless necessary for this form.
        </div>
      )}

      {piiStep && (
        <div className="mb-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Use exact words in quotes. Do not add extra names or NDIS numbers.
        </div>
      )}

      <div className="mt-4 space-y-4 rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-6">
        {stepFields.map((field) => {
          if (field.type === 'section') {
            return (
              <div key={field.id}>
                <h3 className="text-base font-semibold text-slate-900">{field.label}</h3>
                {field.helpText && (
                  <p className="mt-1 text-sm text-slate-600">{field.helpText}</p>
                )}
              </div>
            )
          }

          if (field.type === 'script') {
            return (
              <div key={field.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                  Say aloud — do not type
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                  {field.scriptText ?? field.label}
                </p>
              </div>
            )
          }

          if (field.type === 'textarea') {
            return (
              <TextArea
                key={field.id}
                id={field.id}
                label={field.label}
                error={errors[field.id]?.message as string}
                {...register(field.id)}
              />
            )
          }
          if (field.type === 'select' || field.type === 'yesno') {
            const options =
              field.type === 'yesno'
                ? [
                    { value: '', label: 'Select…' },
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ]
                : [
                    { value: '', label: 'Select…' },
                    ...(field.options ?? []).map((o) => ({ value: o, label: o })),
                  ]
            return (
              <Select
                key={field.id}
                id={field.id}
                label={field.label}
                options={options}
                error={errors[field.id]?.message as string}
                {...register(field.id)}
              />
            )
          }
          if (field.type === 'multiselect') {
            return (
              <Controller
                key={field.id}
                name={field.id}
                control={control}
                defaultValue={[]}
                render={({ field: ctrl }) => (
                  <div>
                    <p className="mb-2 block text-sm font-medium text-[var(--cmd-text)]">
                      {field.label}
                    </p>
                    <div className="space-y-2">
                      {(field.options ?? []).map((opt) => {
                        const selected = Array.isArray(ctrl.value) ? ctrl.value.includes(opt) : false
                        return (
                          <Checkbox
                            key={opt}
                            id={`${field.id}-${opt}`}
                            label={opt}
                            checked={selected}
                            onChange={(e) => {
                              const current = Array.isArray(ctrl.value) ? ctrl.value : []
                              ctrl.onChange(
                                e.target.checked
                                  ? [...current, opt]
                                  : current.filter((v: string) => v !== opt),
                              )
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              />
            )
          }
          return (
            <Input
              key={field.id}
              id={field.id}
              label={field.label}
              type={field.type === 'number' ? 'number' : 'text'}
              error={errors[field.id]?.message as string}
              {...register(field.id)}
            />
          )
        })}
      </div>

      {showAttestations && (
        <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-900">Before you submit, please confirm:</p>
          {finalAttestations.map((item) => (
            <Checkbox
              key={item.id}
              id={`attest-${item.id}`}
              label={item.label}
              checked={Boolean(attestationState[item.id])}
              onChange={(e) =>
                setAttestationState((prev) => ({ ...prev, [item.id]: e.target.checked }))
              }
            />
          ))}
        </div>
      )}

      {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

      <div className="mt-6 flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        {!isLastStep ? (
          <Button
            type="button"
            onClick={() => {
              setStepIndex((s) => Math.min(steps.length - 1, s + 1))
            }}
          >
            Continue
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : submitLabel}
          </Button>
        )}
      </div>
    </form>
  )
}
