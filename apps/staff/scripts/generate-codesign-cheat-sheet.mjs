/**
 * Build the co-design facilitator cheat sheet PDF from codesign-cheat-sheet-content.ts.
 *
 * Usage: npm run generate:codesign-cheat-sheet
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

import {
  CHEAT_SHEET_SECTIONS,
  CHEAT_SHEET_VERSION,
} from '../src/lib/codesign-cheat-sheet-content.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '../public/job-aids/codesign-facilitator-cheat-sheet.pdf')

const FOOTER_TEXT = 'Monash 51358 · Financial Literacy Australia · mentors@flaus.com.au'

/** Section ids grouped onto one printed page each (~4 pages total). */
const PAGE_GROUPS = [
  ['cover', 'before-session', 'welcome'],
  ['privacy-disclosure', 'contact-details'],
  ['during-session', 'ten-second-rule', 'golden-rule'],
  ['distress', 'quotes-notes', 'privacy-basics', 'privacy-help'],
]

const sectionById = Object.fromEntries(CHEAT_SHEET_SECTIONS.map((s) => [s.id, s]))

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderBlock(section) {
  switch (section.kind) {
    case 'cover':
      return `
        <div class="block block-cover">
          <h1>${escapeHtml(section.title)}</h1>
          <p class="subtitle">${escapeHtml(section.subtitle)} · v${escapeHtml(CHEAT_SHEET_VERSION)}</p>
          <p class="how-to">${escapeHtml(section.howToUse[0] ?? '')}</p>
        </div>`

    case 'checklist':
    case 'rules':
      return `
        <div class="block">
          <h2>${escapeHtml(section.title)}</h2>
          <ul class="checklist">${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>`

    case 'bullets':
      return `
        <div class="block">
          <h2>${escapeHtml(section.title)}</h2>
          ${section.intro ? `<p class="intro">${escapeHtml(section.intro)}</p>` : ''}
          <ul class="bullets">${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>`

    case 'callout': {
      const calloutClass =
        section.calloutKind === 'warning'
          ? 'callout warning'
          : section.calloutKind === 'quote'
            ? 'callout quote'
            : section.calloutKind === 'tip'
              ? 'callout tip'
              : 'callout script'
      const scriptClass = section.calloutKind === 'script' ? ' script-compact' : ''
      return `
        <div class="block">
          <h2>${escapeHtml(section.title)}</h2>
          ${section.calloutKind === 'script' ? '<p class="warn-label">Do not paraphrase</p>' : ''}
          <div class="${calloutClass}${scriptClass}">
            <p>${escapeHtml(section.body)}</p>
          </div>
          ${section.note ? `<p class="note">${escapeHtml(section.note)}</p>` : ''}
        </div>`
    }

    case 'distress':
      return `
        <div class="block">
          <h2>${escapeHtml(section.title)}</h2>
          ${section.intro ? `<p class="intro">${escapeHtml(section.intro)}</p>` : ''}
          <dl class="distress">
            ${section.scenarios
              .map(
                (scenario) => `
              <dt>${escapeHtml(scenario.title)}</dt>
              <dd>${escapeHtml(scenario.words)}</dd>`,
              )
              .join('')}
          </dl>
        </div>`

    case 'examples':
      return `
        <div class="block">
          <h2>${escapeHtml(section.title)}</h2>
          ${section.examples
            .map(
              (example) => `
            <p class="example ${example.label === 'Good' ? 'good' : 'bad'}">
              <strong>${escapeHtml(example.label)}:</strong> "${escapeHtml(example.text)}"
            </p>`,
            )
            .join('')}
          ${section.note ? `<p class="note">${escapeHtml(section.note)}</p>` : ''}
        </div>`

    case 'privacy':
      return `
        <div class="block block-compact">
          <h2>${escapeHtml(section.title)}</h2>
          <ul class="inline-pairs">
            <li><strong>OK:</strong> ${escapeHtml(section.ok)}</li>
            <li><strong>Never:</strong> ${escapeHtml(section.never)}</li>
          </ul>
          <p class="note">${escapeHtml(section.note)}</p>
        </div>`

    case 'help':
      return `
        <div class="block block-compact block-inline">
          <h2>${escapeHtml(section.title)}</h2>
          <p><strong>${escapeHtml(section.email)}</strong></p>
        </div>`

    default:
      return ''
  }
}

function renderPage(sectionIds) {
  const blocks = sectionIds
    .map((id) => sectionById[id])
    .filter(Boolean)
    .map(renderBlock)
    .join('\n')

  return `<section class="page">${blocks}</section>`
}

function buildHtml() {
  const body = PAGE_GROUPS.map(renderPage).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>FLAUS Co-design Facilitator Cheat Sheet</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 12mm 16mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      font-size: 10.5pt;
      line-height: 1.4;
      color: #1f2937;
      margin: 0;
    }
    .page {
      page-break-after: always;
      break-after: page;
    }
    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .block {
      margin-bottom: 0.65rem;
    }
    .block:last-child {
      margin-bottom: 0;
    }
    .block-compact {
      margin-bottom: 0.4rem;
    }
    .block-cover {
      margin-bottom: 0.5rem;
    }
    .block-inline h2,
    .block-inline p {
      display: inline;
      margin: 0;
    }
    .block-inline h2::after {
      content: ' — ';
      font-weight: 400;
      color: #4b5563;
    }
    h1 {
      font-size: 17pt;
      color: #0f766e;
      margin: 0 0 0.2rem;
      line-height: 1.15;
    }
    h2 {
      font-size: 12pt;
      color: #0f766e;
      border-left: 3px solid #0f766e;
      padding-left: 0.45rem;
      margin: 0 0 0.35rem;
      line-height: 1.2;
    }
    .subtitle, .how-to {
      color: #4b5563;
      margin: 0.15rem 0;
      font-size: 9.5pt;
    }
    .intro {
      margin: 0 0 0.25rem;
      font-size: 10pt;
    }
    ul {
      margin: 0;
      padding-left: 1.1rem;
    }
    li { margin: 0.2rem 0; }
    .inline-pairs {
      list-style: none;
      padding-left: 0;
    }
    .inline-pairs li {
      margin: 0.15rem 0;
    }
    .callout {
      padding: 0.5rem 0.65rem;
      border-radius: 4px;
      margin: 0.25rem 0;
    }
    .callout p {
      margin: 0;
    }
    .callout.script {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      font-size: 9pt;
      line-height: 1.35;
    }
    .callout.script-compact {
      column-count: 2;
      column-gap: 0.75rem;
    }
    .callout.quote {
      background: #f0fdfa;
      border: 1px solid #5eead4;
      font-size: 12pt;
      font-weight: 600;
      text-align: center;
      padding: 0.45rem 0.65rem;
    }
    .callout.tip {
      background: #eff6ff;
      border: 1px solid #93c5fd;
      font-size: 10pt;
      display: inline-block;
      width: 100%;
    }
    .callout.warning {
      background: #fef2f2;
      border: 1px solid #fca5a5;
    }
    .warn-label {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #92400e;
      margin: 0 0 0.25rem;
    }
    .note {
      color: #4b5563;
      font-size: 9pt;
      margin: 0.25rem 0 0;
    }
    .distress {
      margin: 0;
      display: grid;
      grid-template-columns: 5.5rem 1fr;
      gap: 0.15rem 0.5rem;
    }
    .distress dt {
      font-weight: 700;
      color: #0f766e;
      margin: 0;
    }
    .distress dd {
      margin: 0;
    }
    .example {
      margin: 0.2rem 0;
      font-size: 10pt;
    }
    .example.good { color: #065f46; }
    .example.bad { color: #991b1b; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`
}

async function main() {
  const html = buildHtml()
  mkdirSync(dirname(OUT_PATH), { recursive: true })

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '12mm', bottom: '16mm', left: '12mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#6b7280;text-align:center;padding:0 12mm;">
          ${escapeHtml(FOOTER_TEXT)} · Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
    })
    writeFileSync(OUT_PATH, pdf)

    const countMatch = pdf.toString('latin1').match(/\/Count\s+(\d+)/g)
    const pageTotal = countMatch
      ? Math.max(...countMatch.map((m) => Number(m.replace(/\D/g, ''))))
      : null

    console.log(`Wrote ${OUT_PATH} (${pdf.length} bytes, ${pageTotal ?? '?'} pages)`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
