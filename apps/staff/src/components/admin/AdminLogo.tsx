import React from 'react'

export default function AdminLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#1c1c1e',
          border: '1px solid #2c2c2e',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 14,
        }}
        aria-hidden
      >
        F
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#8e8e93', textTransform: 'uppercase' }}>
          FLAUS
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', lineHeight: 1.2 }}>
          Command
        </div>
      </div>
    </div>
  )
}
