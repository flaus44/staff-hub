import React from 'react'

export default function AdminPortalExitButton() {
  return (
    <a href="/dashboard" className="staff-hub-admin-exit-btn" title="Return to staff portal home">
      <svg
        className="staff-hub-admin-exit-btn__icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 9.75L12 3l9 6.75V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.75z"
        />
      </svg>
      <span className="staff-hub-admin-exit-btn__label">Staff portal</span>
    </a>
  )
}
