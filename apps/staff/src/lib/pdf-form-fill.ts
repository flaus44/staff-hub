import {
  drawSignatureInBox,
  trimSignaturePng,
  type SignatureBox,
} from '@/lib/signature-image'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  PDFDocument,
  PDFName,
  StandardFonts,
  type PDFCheckBox,
  type PDFForm,
  type PDFRadioGroup,
} from 'pdf-lib'

export type OfficialFormId =
  | 'nat3092'
  | 'nat3093'
  | 'nat13080'
  | 'fwis'
  | 'ceis'
  | 'ftcis'

export type PdfTemplateRef = {
  formId: OfficialFormId
  version: string
  fileName: string
}

export type PdfFillFieldMap = {
  text?: Record<string, string>
  checkboxes?: Record<string, string>
  checkboxExports?: Record<string, string>
  radios?: Record<string, string>
}

const TEMPLATE_FILENAMES: Record<OfficialFormId, string> = {
  nat3092: 'NAT3092-06.2019.pdf',
  nat3093: 'NAT3093-current.pdf',
  nat13080: 'NAT13080-2023-04.pdf',
  fwis: 'FWIS-current.pdf',
  ceis: 'CEIS-current.pdf',
  ftcis: 'FTCIS-current.pdf',
}

function templateCandidates(fileName: string): string[] {
  return [
    path.join(process.cwd(), 'assets', 'forms', fileName),
    path.join(process.cwd(), 'apps', 'staff', 'assets', 'forms', fileName),
  ]
}

export async function resolveOfficialTemplatePath(formId: OfficialFormId): Promise<PdfTemplateRef> {
  const fileName = TEMPLATE_FILENAMES[formId]
  for (const candidate of templateCandidates(fileName)) {
    try {
      await fs.access(candidate)
      return {
        formId,
        version: fileName.replace(/\.pdf$/i, ''),
        fileName: candidate,
      }
    } catch {
      // Continue to next candidate.
    }
  }
  throw new Error(`Official template missing for ${formId}: expected ${fileName} in assets/forms`)
}

export async function loadOfficialTemplate(formId: OfficialFormId): Promise<{
  pdf: PDFDocument
  template: PdfTemplateRef
}> {
  const template = await resolveOfficialTemplatePath(formId)
  const bytes = await fs.readFile(template.fileName)
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true })
  return { pdf, template }
}

function sanitize(value: string): string {
  return value.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim()
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function formatGroupedDigits(digits: string, groups: number[]): string {
  const parts: string[] = []
  let offset = 0
  for (const size of groups) {
    const part = digits.slice(offset, offset + size)
    if (!part) break
    parts.push(part)
    offset += size
  }
  return parts.join(' ')
}

function isCompactCombField(fieldName: string): boolean {
  return (
    /date/i.test(fieldName) ||
    /postcode/i.test(fieldName) ||
    /state/i.test(fieldName) ||
    /5-addressLine/i.test(fieldName) ||
    /branchNumber|contactPhone|BSB|accountNumber|EmployeeNo|MemberAccNo/i.test(fieldName) ||
    fieldName === '7-amount'
  )
}

function normalizeCombText(value: string, maxLength?: number): string {
  const normalized = value.replace(/\s+/g, ' ')
  if (maxLength !== undefined && normalized.length > maxLength) {
    return normalized.slice(0, maxLength)
  }
  return normalized
}

/**
 * NAT comb fields reserve cells for display gaps (e.g. TFN XXX XXX XXX).
 * pdf-lib places one character per comb cell, so grouped values must include spaces.
 */
function formatCombTextFieldValue(
  fieldName: string,
  maxLength: number | undefined,
  value: string,
): string {
  const cleaned = sanitize(value)
  if (!cleaned) return ''

  if (maxLength === 11 && /TFN/i.test(fieldName)) {
    return formatGroupedDigits(digitsOnly(cleaned), [3, 3, 3])
  }

  if (maxLength === 14 && /ABN|SuperABN/i.test(fieldName)) {
    return formatGroupedDigits(digitsOnly(cleaned), [2, 3, 3, 3])
  }

  if (/USI/i.test(fieldName)) {
    return cleaned.replace(/\s+/g, '').slice(0, maxLength ?? cleaned.length)
  }

  if (isCompactCombField(fieldName)) {
    const compact = cleaned.replace(/\s+/g, '')
    if (maxLength !== undefined && compact.length > maxLength) {
      return compact.slice(0, maxLength)
    }
    return compact
  }

  return normalizeCombText(cleaned, maxLength)
}

export function stripPdfFieldBorders(form: PDFForm): void {
  for (const field of form.getFields()) {
    for (const widget of field.acroField.getWidgets()) {
      widget.dict.delete(PDFName.of('BS'))
      widget.dict.delete(PDFName.of('MK'))
      widget.dict.delete(PDFName.of('Border'))
    }
  }
}

function requireCheckBox(form: PDFForm, fieldName: string): PDFCheckBox {
  try {
    return form.getCheckBox(fieldName)
  } catch {
    throw new Error(`Missing checkbox field in template: ${fieldName}`)
  }
}

function requireRadioGroup(form: PDFForm, fieldName: string): PDFRadioGroup {
  try {
    return form.getRadioGroup(fieldName)
  } catch {
    throw new Error(`Missing radio field in template: ${fieldName}`)
  }
}

export function fillTextField(form: PDFForm, fieldName: string, value: string): void {
  try {
    const field = form.getTextField(fieldName)
    const text = field.isCombed()
      ? formatCombTextFieldValue(fieldName, field.getMaxLength(), value)
      : sanitize(value)
    field.setText(text)
  } catch {
    throw new Error(`Missing text field in template: ${fieldName}`)
  }
}

export function fillCheckBox(form: PDFForm, fieldName: string, checked: boolean): void {
  const field = requireCheckBox(form, fieldName)
  if (checked) {
    field.check()
  } else {
    field.uncheck()
  }
}

function normalizePdfNameToken(token: string): string {
  return token.startsWith('/') ? token.slice(1) : token
}

export function fillCheckBoxExport(form: PDFForm, fieldName: string, exportValue: string): void {
  const field = requireCheckBox(form, fieldName)
  const normalized = normalizePdfNameToken(exportValue)
  const widgets = field.acroField.getWidgets()
  const supported = new Set(widgets.map((widget) => normalizePdfNameToken(String(widget.getOnValue()))))
  if (!supported.has(normalized)) {
    throw new Error(`Invalid checkbox export option "${exportValue}" for ${fieldName}`)
  }
  field.acroField.dict.set(PDFName.of('V'), PDFName.of(normalized))
  for (const widget of widgets) {
    const onValue = normalizePdfNameToken(String(widget.getOnValue()))
    widget.setAppearanceState(PDFName.of(onValue === normalized ? onValue : 'Off'))
  }
  field.acroField.dict.set(PDFName.of('AS'), PDFName.of(normalized))
}

export function fillRadioGroup(form: PDFForm, fieldName: string, value: string): void {
  const field = requireRadioGroup(form, fieldName)
  const options = field.getOptions()
  if (!options.includes(value)) {
    throw new Error(`Invalid radio option "${value}" for ${fieldName}`)
  }
  field.select(value)
}

export function fillPdfFormStrict(
  form: PDFForm,
  values: {
    text?: Record<string, string | null | undefined>
    checkboxes?: Record<string, boolean | null | undefined>
    checkboxExports?: Record<string, string | null | undefined>
    radios?: Record<string, string | null | undefined>
  },
): void {
  stripPdfFieldBorders(form)

  for (const [fieldName, value] of Object.entries(values.text ?? {})) {
    if (value == null || value === '') continue
    fillTextField(form, fieldName, String(value))
  }

  for (const [fieldName, value] of Object.entries(values.checkboxes ?? {})) {
    if (value == null) continue
    fillCheckBox(form, fieldName, Boolean(value))
  }

  for (const [fieldName, value] of Object.entries(values.checkboxExports ?? {})) {
    if (!value) continue
    fillCheckBoxExport(form, fieldName, String(value))
  }

  for (const [fieldName, value] of Object.entries(values.radios ?? {})) {
    if (!value) continue
    fillRadioGroup(form, fieldName, String(value))
  }
}

export async function assertFieldMapMatchesTemplate(
  formId: OfficialFormId,
  map: PdfFillFieldMap,
): Promise<{ skipped: boolean; reason?: string }> {
  try {
    const { pdf } = await loadOfficialTemplate(formId)
    const form = pdf.getForm()
    const fieldNames = new Set(form.getFields().map((field) => field.getName()))
    const expected = [
      ...Object.values(map.text ?? {}),
      ...Object.values(map.checkboxes ?? {}),
      ...Object.values(map.checkboxExports ?? {}),
      ...Object.values(map.radios ?? {}),
    ]
    const missing = expected.filter((fieldName) => !fieldNames.has(fieldName))
    if (missing.length > 0) {
      throw new Error(`Template ${formId} missing fields: ${missing.join(', ')}`)
    }
    return { skipped: false }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Official template missing')) {
      return { skipped: true, reason: error.message }
    }
    throw error
  }
}

export type SignaturePlacement =
  | {
      mode: 'absoluteRect'
      pageIndex: number
      x: number
      y: number
      width: number
      height: number
    }
  | {
      mode: 'anchorBox'
      anchorField: string
      box: { dx: number; dy: number; width: number; height: number }
    }

export type OfficialFormSignaturePlacement = {
  dataUrl: string
  placements: SignaturePlacement[]
}

async function embedPngFromDataUrl(pdf: PDFDocument, dataUrl: string) {
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  const sigBytes = Buffer.from(b64, 'base64')
  return pdf.embedPng(sigBytes)
}

function resolveAnchorSignatureBox(
  pdf: PDFDocument,
  form: PDFForm,
  placement: Extract<SignaturePlacement, { mode: 'anchorBox' }>,
): { page: ReturnType<PDFDocument['getPage']>; box: SignatureBox } | null {
  try {
    const field = form.getTextField(placement.anchorField)
    const widgets = field.acroField.getWidgets()
    if (widgets.length === 0) return null

    const rect = widgets[0].getRectangle()
    const page = pdf.getPages().find((p) => p.ref === widgets[0].P())
    if (!page) return null

    return {
      page,
      box: {
        x: rect.x + placement.box.dx,
        y: rect.y + placement.box.dy,
        width: placement.box.width,
        height: placement.box.height,
      },
    }
  } catch {
    return null
  }
}

/**
 * Draws a trimmed signature PNG using calibrated absolute or anchor-relative boxes.
 */
export async function embedSignatureInOfficialForm(
  pdf: PDFDocument,
  placement: OfficialFormSignaturePlacement,
): Promise<boolean> {
  if (!placement.dataUrl || placement.placements.length === 0) return false

  try {
    const trimmed = await trimSignaturePng(placement.dataUrl)
    const sigImage = await embedPngFromDataUrl(pdf, trimmed)
    const form = pdf.getForm()
    let placed = false

    for (const item of placement.placements) {
      if (item.mode === 'absoluteRect') {
        const page = pdf.getPage(item.pageIndex)
        drawSignatureInBox(page, sigImage, {
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
        })
        placed = true
        continue
      }

      const resolved = resolveAnchorSignatureBox(pdf, form, item)
      if (resolved) {
        drawSignatureInBox(resolved.page, sigImage, resolved.box)
        placed = true
      }
    }

    return placed
  } catch {
    return false
  }
}

export async function saveFilledOfficialForm(args: {
  formId: OfficialFormId
  values: {
    text?: Record<string, string | null | undefined>
    checkboxes?: Record<string, boolean | null | undefined>
    checkboxExports?: Record<string, string | null | undefined>
    radios?: Record<string, string | null | undefined>
  }
  signature?: OfficialFormSignaturePlacement
}): Promise<{ bytes: Uint8Array; templateVersion: string }> {
  const { pdf, template } = await loadOfficialTemplate(args.formId)
  const form = pdf.getForm()
  fillPdfFormStrict(form, args.values)
  if (args.signature) {
    await embedSignatureInOfficialForm(pdf, args.signature)
  }
  try {
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    form.updateFieldAppearances(font)
  } catch {
    // Some official templates ship embedded fonts; flatten can still succeed.
  }
  form.flatten()
  return {
    bytes: await pdf.save(),
    templateVersion: template.version,
  }
}

export async function copyOfficialFormBytes(formId: OfficialFormId): Promise<{
  bytes: Uint8Array
  templateVersion: string
}> {
  const template = await resolveOfficialTemplatePath(formId)
  const bytes = await fs.readFile(template.fileName)
  return { bytes: new Uint8Array(bytes), templateVersion: template.version }
}
