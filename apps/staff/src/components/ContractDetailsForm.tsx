'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { SurveyField } from '@/components/DynamicSurveyForm'
import { CONTRACT_FORM_STEP_TITLES } from '@/lib/contract-form'
import { StepIndicator } from '@flaus/ui-forms/StepIndicator'
import { Input } from '@flaus/ui-forms/Input'
import { Select } from '@flaus/ui-forms/Select'
import { Button } from '@flaus/ui-forms/Button'

function buildSchema(fields: SurveyField[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    let schema: z.ZodTypeAny = z.string()
    if (!field.required) schema = schema.optional()
    else schema = (schema as z.ZodString).min(1, 'This field is required')
    shape[field.id] = schema
  }
  return z.object(shape)
}

interface ContractDetailsFormProps {
  fields: SurveyField[]
  defaultValues: Record<string, string>
  finalButtonLabel?: string
  onComplete: (values: Record<string, string>) => void
}

export function ContractDetailsForm({
  fields,
  defaultValues,
  finalButtonLabel = 'Review contract',
  onComplete,
}: ContractDetailsFormProps) {
  const steps = [...new Set(fields.map((f) => f.step ?? 1))].sort((a, b) => a - b)
  const [stepIndex, setStepIndex] = useState(0)
  const currentStep = steps[stepIndex] ?? 1
  const stepFields = fields.filter((f) => (f.step ?? 1) === currentStep)
  const stepFieldIds = stepFields.map((f) => f.id)

  const schema = buildSchema(fields)
  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onTouched',
  })

  async function handleContinue() {
    const valid = await trigger(stepFieldIds)
    if (!valid) return

    if (stepIndex < steps.length - 1) {
      setStepIndex((s) => s + 1)
      return
    }

    onComplete(getValues())
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-primary-800">Step {stepIndex + 1}: Enter your details</h2>
        <p className="text-sm text-[var(--cmd-text-muted)] mt-1">
          {CONTRACT_FORM_STEP_TITLES[currentStep] ?? 'Complete the fields below before reviewing the contract.'}
        </p>
      </div>

      <StepIndicator currentStep={stepIndex + 1} totalSteps={steps.length} />

      <div className="bg-[var(--cmd-surface)] rounded-xl border border-[var(--cmd-border)] p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stepFields.map((field) => {
            if (field.type === 'select') {
              return (
                <Select
                  key={field.id}
                  id={field.id}
                  label={field.label}
                  options={[
                    { value: '', label: 'Select…' },
                    ...(field.options ?? []).map((o) => ({ value: o, label: o })),
                  ]}
                  error={errors[field.id]?.message as string}
                  {...register(field.id)}
                />
              )
            }

            return (
              <Input
                key={field.id}
                id={field.id}
                label={field.label}
                type={field.id === 'email' ? 'email' : field.id === 'mobile' ? 'tel' : 'text'}
                error={errors[field.id]?.message as string}
                required={field.required}
                className={field.id === 'address' ? 'md:col-span-2' : undefined}
                {...register(field.id)}
              />
            )
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        <Button type="button" onClick={handleContinue}>
          {stepIndex < steps.length - 1 ? 'Continue' : finalButtonLabel}
        </Button>
      </div>
    </div>
  )
}
