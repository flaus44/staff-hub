import React, { forwardRef } from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  id: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    return (
      <div className={`space-y-1 ${className}`}>
        <label htmlFor={id} className="block text-sm font-medium text-[var(--cmd-text-muted)]">
          {label} {props.required && <span className="text-[var(--cmd-critical)]">*</span>}
        </label>
        <textarea
          id={id}
          ref={ref}
          className={`block w-full rounded-md border shadow-sm sm:text-sm px-3 py-2 min-h-[100px] bg-[var(--cmd-surface-raised)] text-[var(--cmd-text)]
            ${error ? 'border-[var(--cmd-critical)]' : 'border-[var(--cmd-border)] focus:border-[var(--cmd-accent)] focus:ring-[var(--cmd-accent)]'}
          `}
          {...props}
        />
        {error && <p className="text-sm text-[var(--cmd-critical)]">{error}</p>}
      </div>
    )
  },
)
TextArea.displayName = 'TextArea'
