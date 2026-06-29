import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  id: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    return (
      <div className={`space-y-1 ${className}`}>
        <label htmlFor={id} className="block text-sm font-medium text-[var(--cmd-text-muted)]">
          {label} {props.required && <span className="text-[var(--cmd-critical)]">*</span>}
        </label>
        <input
          id={id}
          ref={ref}
          className={`block w-full rounded-md border shadow-sm sm:text-sm h-[44px] px-3 bg-[var(--cmd-surface-raised)] text-[var(--cmd-text)]
            ${error ? 'border-[var(--cmd-critical)] focus:border-[var(--cmd-critical)] focus:ring-[var(--cmd-critical)]' : 'border-[var(--cmd-border)] focus:border-[var(--cmd-accent)] focus:ring-[var(--cmd-accent)]'}
          `}
          {...props}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {error && (
          <p id={`${id}-error`} className="text-sm text-[var(--cmd-critical)]">
            {error}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
