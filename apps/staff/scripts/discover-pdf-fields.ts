import fs from 'node:fs/promises'
import path from 'node:path'

import { PDFCheckBox, PDFDocument, PDFRadioGroup, type PDFField } from 'pdf-lib'

const FORMS = [
  'NAT3092-06.2019.pdf',
  'NAT3093-current.pdf',
  'NAT13080-2023-04.pdf',
  'FWIS-current.pdf',
  'CEIS-current.pdf',
  'FTCIS-current.pdf',
]

const SIGNATURE_ANCHOR_FIELDS = new Set([
  '2-firstName',
  'DecPayee-dateDay',
  'B-yourName',
  'B-Day',
  'C-Day',
  'D-name',
  'D-Day',
])

function candidates(fileName: string): string[] {
  return [
    path.join(process.cwd(), 'assets', 'forms', fileName),
    path.join(process.cwd(), 'apps', 'staff', 'assets', 'forms', fileName),
  ]
}

async function resolveTemplate(fileName: string): Promise<string | null> {
  for (const candidate of candidates(fileName)) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // continue
    }
  }
  return null
}

function getFieldOptions(field: PDFField): string[] {
  if (field instanceof PDFRadioGroup) {
    return field.getOptions()
  }
  if (field instanceof PDFCheckBox) {
    const options = field.acroField
      .getWidgets()
      .map((widget) => String(widget.getOnValue()))
      .map((value) => (value.startsWith('/') ? value.slice(1) : value))
      .filter(Boolean)
    return Array.from(new Set(options)).sort()
  }
  return []
}

function formatWidgetRect(field: PDFField, pdf: PDFDocument): string | null {
  const widgets = field.acroField.getWidgets()
  if (widgets.length === 0) return null
  const pages = pdf.getPages()
  return widgets
    .map((widget) => {
      const rect = widget.getRectangle()
      const pageIndex = pages.findIndex((page) => page.ref === widget.P())
      return `page=${pageIndex + 1} x=${rect.x.toFixed(1)} y=${rect.y.toFixed(1)} w=${rect.width.toFixed(1)} h=${rect.height.toFixed(1)}`
    })
    .join(' | ')
}

async function run() {
  for (const fileName of FORMS) {
    const filePath = await resolveTemplate(fileName)
    if (!filePath) {
      console.log(`[skip] ${fileName} not found`)
      continue
    }
    const bytes = await fs.readFile(filePath)
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const fields = pdf.getForm().getFields()
    const sortedFields = fields.sort((a, b) => a.getName().localeCompare(b.getName()))
    const pageSummary = pdf
      .getPages()
      .map((page, index) => {
        const size = page.getSize()
        return `p${index + 1}:${size.width.toFixed(2)}x${size.height.toFixed(2)}`
      })
      .join(', ')
    console.log(`\n=== ${fileName} (${sortedFields.length} fields) [${pageSummary}] ===`)
    for (const field of sortedFields) {
      const fieldName = field.getName()
      const options = getFieldOptions(field)
      const rect = formatWidgetRect(field, pdf)
      const anchorTag = SIGNATURE_ANCHOR_FIELDS.has(fieldName) ? ' [signature-anchor]' : ''
      if (options.length > 0) {
        console.log(`${fieldName} [options: ${options.join(', ')}]${rect ? ` {${rect}}` : ''}${anchorTag}`)
      } else if (rect) {
        console.log(`${fieldName} {${rect}}${anchorTag}`)
      } else {
        console.log(fieldName)
      }
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
