import React from 'react'

/** Payload step-nav home slot is 18×18px — keep the mark compact and aligned. */
export default function AdminIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden style={{ display: 'block' }}>
      <rect width="18" height="18" rx="4" fill="#3e6ae1" />
      <text
        x="9"
        y="12.5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="9"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        F
      </text>
    </svg>
  )
}
