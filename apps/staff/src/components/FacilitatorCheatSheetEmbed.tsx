'use client'

import {
  CHEAT_SHEET_PDF_PATH,
  cheatSheetPdfUrl,
} from '@/lib/codesign-cheat-sheet-content'

type FacilitatorCheatSheetEmbedProps = {
  title?: string
}

export function FacilitatorCheatSheetEmbed({
  title = 'Facilitator cheat sheet',
}: FacilitatorCheatSheetEmbedProps) {
  const pdfUrl = cheatSheetPdfUrl()
  const downloadUrl = CHEAT_SHEET_PDF_PATH

  return (
    <article
      id="cheat-sheet"
      className="scroll-mt-6 overflow-hidden rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--cmd-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--cmd-text)]">{title}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] text-xs font-semibold text-[var(--cmd-accent)] underline"
          >
            Open full screen
          </a>
          <a
            href={downloadUrl}
            download="codesign-facilitator-cheat-sheet.pdf"
            className="min-h-[44px] text-xs font-semibold text-[var(--cmd-accent)] underline"
          >
            Download PDF
          </a>
        </div>
      </div>
      <p className="border-b border-[var(--cmd-border)] px-4 py-2 text-xs text-[var(--cmd-text-muted)]">
        Print or read on screen — everything you need for a co-design session. On iPhone or iPad,
        use Open full screen if the preview does not appear.
      </p>
      <object
        data={`${pdfUrl}#view=FitH&toolbar=0`}
        type="application/pdf"
        className="h-[70vh] min-h-[480px] w-full bg-white"
      >
        <iframe title={`${title} preview`} src={pdfUrl} className="h-[70vh] min-h-[480px] w-full bg-white" />
      </object>
    </article>
  )
}
