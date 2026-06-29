import React, { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'dark'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', className = '', ...props }, ref) => {
    const variants = {
      primary: 'bg-[var(--cmd-accent)] text-white hover:brightness-110 focus:ring-[rgba(62,106,225,0.35)]',
      secondary:
        'bg-[var(--cmd-surface-raised)] text-[var(--cmd-text)] border border-[var(--cmd-border)] hover:bg-[var(--cmd-border)] focus:ring-[var(--cmd-border)]',
      outline:
        'bg-transparent text-[var(--cmd-text)] border border-[var(--cmd-border)] hover:bg-[var(--cmd-surface-raised)] focus:ring-[var(--cmd-border)]',
      dark: 'bg-[var(--cmd-text)] text-[var(--cmd-bg)] hover:opacity-90 focus:ring-[var(--cmd-border)]',
    }

    return (
      <button
        ref={ref}
        className={`min-h-[44px] px-2.5 py-2 rounded-lg font-medium focus:outline-none focus:ring-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
