import React, { forwardRef } from 'react'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  id: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className = '', ...props }, ref) => {
    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <input
          id={id}
          ref={ref}
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] text-[var(--cmd-accent)] focus:ring-[var(--cmd-accent)]"
          {...props}
        />
        <label htmlFor={id} className="text-sm text-[var(--cmd-text-muted)]">
          {label}
        </label>
      </div>
    )
  },
)
Checkbox.displayName = 'Checkbox'
