import React from 'react'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="mb-8 p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-slate-800" aria-live="polite">
          Step {currentStep} of {totalSteps}
        </h2>
      </div>
      <div
        className="flex gap-2"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
      >
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={`h-2 flex-1 rounded-full ${
              idx + 1 <= currentStep ? 'bg-primary-700' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
