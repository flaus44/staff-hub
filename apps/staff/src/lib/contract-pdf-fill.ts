import { PDFDocument, PDFName, type PDFForm } from 'pdf-lib'

import type { ContractPdfFieldMap } from '@/lib/contract-form'
import {
  drawSignatureInBox,
  expandSignatureBox,
  trimSignaturePng,
} from '@/lib/signature-image'

function sanitize(value: string): string {
  return value.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim()
}

export function stripPdfFieldBorders(form: PDFForm): void {
  try {
    for (const field of form.getFields()) {
      try {
        for (const widget of field.acroField.getWidgets()) {
          widget.dict.delete(PDFName.of('BS'))
          widget.dict.delete(PDFName.of('MK'))
          widget.dict.delete(PDFName.of('Border'))
        }
      } catch {
        // skip widget
      }
    }
  } catch {
    // skip form
  }
}

export function fillPdfFormFields(
  form: PDFForm,
  formValues: Record<string, unknown>,
  pdfFieldMap: ContractPdfFieldMap,
): void {
  const setField = (fieldName: string, value: string) => {
    try {
      const field = form.getTextField(fieldName)
      field.setText(sanitize(value))
    } catch {
      // field may not exist on this template
    }
  }

  for (const [formKey, pdfFieldName] of Object.entries(pdfFieldMap)) {
    const raw = formValues[formKey]
    if (raw == null || raw === '') continue
    setField(pdfFieldName, String(raw))
  }
}

export async function embedSignatureInPdf(
  pdf: PDFDocument,
  signatureDataUrl: string,
  signerName: string,
): Promise<boolean> {
  try {
    const trimmed = await trimSignaturePng(signatureDataUrl)
    const b64 = trimmed.includes(',') ? trimmed.split(',')[1] : trimmed
    const sigBytes = Buffer.from(b64, 'base64')
    const sigImage = await pdf.embedPng(sigBytes)
    const form = pdf.getForm()

    try {
      const sigField = form.getTextField('SignatureBox')
      const widgets = sigField.acroField.getWidgets()
      if (widgets.length > 0) {
        const rect = widgets[0].getRectangle()
        const page = pdf.getPages().find((p) => p.ref === widgets[0].P())
        if (page) {
          drawSignatureInBox(
            page,
            sigImage,
            expandSignatureBox({
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }),
          )
          form.removeField(sigField)
          return true
        }
      }
    } catch {
      // no SignatureBox field
    }

    try {
      form.getTextField('SignatureName').setText(sanitize(signerName))
    } catch {
      // optional field
    }
  } catch {
    return false
  }

  return false
}

export async function applyFormValuesToPdf(
  pdf: PDFDocument,
  args: {
    formValues?: Record<string, unknown> | null
    pdfFieldMap?: ContractPdfFieldMap | null
    signatureDataUrl?: string
    signerName?: string
    flatten?: boolean
  },
): Promise<void> {
  const formValues = args.formValues ?? {}
  const pdfFieldMap = args.pdfFieldMap ?? {}

  if (Object.keys(formValues).length === 0 && !args.signatureDataUrl) return

  let form: PDFForm | null = null
  try {
    form = pdf.getForm()
  } catch {
    return
  }

  if (Object.keys(pdfFieldMap).length > 0 && Object.keys(formValues).length > 0) {
    stripPdfFieldBorders(form)
    fillPdfFormFields(form, formValues, pdfFieldMap)
  }

  if (args.signatureDataUrl && args.signerName) {
    await embedSignatureInPdf(pdf, args.signatureDataUrl, args.signerName)
  }

  if (args.flatten !== false) {
    try {
      form.flatten()
    } catch {
      // non-form PDF
    }
  }
}

export async function appendFormValuesSummaryPage(
  pdf: PDFDocument,
  formValues: Record<string, unknown>,
  fieldLabels: Record<string, string>,
): Promise<void> {
  const { rgb, StandardFonts } = await import('pdf-lib')
  const page = pdf.addPage([595, 842])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  let y = 800
  page.drawText('Contract details', { x: 50, y, size: 16, font: bold, color: rgb(0.08, 0.16, 0.36) })
  y -= 36

  for (const [key, value] of Object.entries(formValues)) {
    if (value == null || value === '') continue
    const label = fieldLabels[key] ?? key
    page.drawText(`${sanitize(label)}:`, { x: 50, y, size: 10, font: bold, color: rgb(0.35, 0.35, 0.35) })
    page.drawText(sanitize(String(value)), { x: 200, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) })
    y -= 18
    if (y < 80) break
  }
}
