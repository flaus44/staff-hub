import React, { forwardRef } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  id: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, options, className = '', ...props }, ref) => {
    return (
      <div className={`space-y-1 ${className}`}>
        <label htmlFor={id} className="block text-sm font-medium text-[var(--cmd-text-muted)]">
          {label} {props.required && <span className="text-[var(--cmd-critical)]">*</span>}
        </label>
        <select
          id={id}
          ref={ref}
          className={`block w-full rounded-md border shadow-sm sm:text-sm h-[44px] px-3 bg-[var(--cmd-surface-raised)] text-[var(--cmd-text)]
            ${error ? 'border-[var(--cmd-critical)]' : 'border-[var(--cmd-border)] focus:border-[var(--cmd-accent)] focus:ring-[var(--cmd-accent)]'}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-[var(--cmd-critical)]">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'
