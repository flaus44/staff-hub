'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

import { Button } from '@flaus/ui-forms/Button'

interface ContractSignedActionsProps {
  contractId: string
  contractTitle: string
  signedAt?: string
}

export function ContractSignedActions({
  contractId,
  contractTitle,
  signedAt,
}: ContractSignedActionsProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [zoom, setZoom] = useState(100)
  const pdfUrl = `/api/portal/contracts/download?contractId=${encodeURIComponent(contractId)}&disposition=inline`

  function handlePrint() {
    const frame = iframeRef.current ?? (document.getElementById(`contract-pdf-${contractId}`) as HTMLIFrameElement | null)
    if (frame?.contentWindow) {
      frame.contentWindow.focus()
      frame.contentWindow.print()
      return
    }
    const win = window.open(pdfUrl, '_blank', 'noopener,noreferrer')
    win?.addEventListener('load', () => win.print())
  }

  function handleDownload() {
    window.open(
      `/api/portal/contracts/download?contractId=${encodeURIComponent(contractId)}&disposition=attachment`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handlePrint} className="rounded-xl text-sm">
          Print
        </Button>
        <Button type="button" variant="outline" onClick={handleDownload} className="rounded-xl text-sm">
          Download PDF
        </Button>
        <Link href="/contracts">
          <Button variant="outline" className="rounded-xl text-sm border-[var(--cmd-border)] text-[var(--cmd-text-muted)]">
            Back to contracts
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] overflow-hidden shadow-sm">
        <div className="bg-primary-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-white font-semibold text-sm">Signed — {contractTitle}</p>
            <p className="text-primary-200 text-xs">
              {signedAt
                ? `Signed ${new Date(signedAt).toLocaleString('en-AU', { dateStyle: 'full', timeStyle: 'short' })}`
                : 'Merged printable PDF with signature record'}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-primary-900/50 p-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="rounded px-2.5 py-1 text-xs text-primary-100 hover:bg-primary-700 min-h-[32px]"
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="text-xs text-primary-100 px-2 tabular-nums">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className="rounded px-2.5 py-1 text-xs text-primary-100 hover:bg-primary-700 min-h-[32px]"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="rounded px-2.5 py-1 text-xs text-primary-100 hover:bg-primary-700 min-h-[32px]"
            >
              Fit
            </button>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-2.5 py-1 text-xs text-primary-100 hover:bg-primary-700 min-h-[32px] flex items-center"
            >
              Open
            </a>
          </div>
        </div>
        <div className="overflow-auto bg-[var(--cmd-surface-raised)]" style={{ height: 'min(700px, 70vh)' }}>
          <iframe
            ref={iframeRef}
            id={`contract-pdf-${contractId}`}
            title={`Signed ${contractTitle}`}
            src={`${pdfUrl}#view=FitH&toolbar=0&zoom=${zoom}`}
            className="w-full bg-[var(--cmd-surface)] transition-transform origin-top-left"
            style={{ height: `${Math.max(600, zoom * 6)}px`, transform: `scale(${zoom / 100})`, width: `${10000 / zoom}%` }}
          />
        </div>
      </div>
    </div>
  )
}
