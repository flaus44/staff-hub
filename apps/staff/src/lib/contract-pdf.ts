import { createHash } from 'node:crypto'

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

import type { DiditDecision } from '@/lib/didit'
import type { ContractPdfFieldMap } from '@/lib/contract-form'
import { E_SIGN_CONSENT_TEXT } from '@/lib/esign-client'
import { appendFormValuesSummaryPage, applyFormValuesToPdf } from '@/lib/contract-pdf-fill'
import { readMediaBytes } from '@/lib/media-files'
import {
  drawSignatureInBox,
  trimSignaturePng,
  type SignatureBox,
} from '@/lib/signature-image'
import type { Payload } from 'payload'

export type ContractDocumentRef = number | string | { id: number | string }

const BRAND = rgb(0.08, 0.16, 0.36)
const MUTED = rgb(0.35, 0.35, 0.35)
const BODY = rgb(0.15, 0.15, 0.15)

const CONTRACT_AUDIT_SIGNATURE_BOX: SignatureBox = {
  x: 420,
  y: 731.89,
  width: 130,
  height: 50,
}

function sanitize(value: string): string {
  return value.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim()
}

export async function resolveContractPdfIds(
  contract: {
    documentPdfs?: ContractDocumentRef[] | null
    templatePdf?: ContractDocumentRef | null
  },
): Promise<(number | string)[]> {
  const fromMany = (contract.documentPdfs ?? []).map((item) =>
    typeof item === 'object' && item !== null && 'id' in item ? item.id : item,
  )
  if (fromMany.length > 0) return fromMany

  if (contract.templatePdf) {
    const id =
      typeof contract.templatePdf === 'object' && contract.templatePdf !== null && 'id' in contract.templatePdf
        ? contract.templatePdf.id
        : contract.templatePdf
    return [id]
  }

  return []
}

export async function mergePdfDocuments(buffers: Uint8Array[]): Promise<PDFDocument> {
  const merged = await PDFDocument.create()

  for (const bytes of buffers) {
    const source = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const pages = await merged.copyPages(source, source.getPageIndices())
    for (const page of pages) {
      merged.addPage(page)
    }
  }

  return merged
}

export async function buildContractPdfFromSources(args: {
  payload: Payload
  documentPdfIds: (number | string)[]
  title: string
  bodyText?: string | null
}): Promise<PDFDocument> {
  if (args.documentPdfIds.length > 0) {
    const buffers: Uint8Array[] = []
    for (const id of args.documentPdfIds) {
      buffers.push(await readMediaBytes(args.payload, id))
    }
    return mergePdfDocuments(buffers)
  }

  return buildBodyTextPdf(args.title, args.bodyText ?? '')
}

export async function prepareContractPdf(args: {
  payload: Payload
  documentPdfIds: (number | string)[]
  title: string
  bodyText?: string | null
  formValues?: Record<string, unknown> | null
  pdfFieldMap?: ContractPdfFieldMap | null
  formFieldLabels?: Record<string, string>
  isPreview?: boolean
  signatureDataUrl?: string
  signerName?: string
}): Promise<PDFDocument> {
  const pdf = await buildContractPdfFromSources({
    payload: args.payload,
    documentPdfIds: args.documentPdfIds,
    title: args.title,
    bodyText: args.bodyText,
  })

  const formValues = args.formValues ?? {}
  const hasFormValues = Object.keys(formValues).length > 0

  if (hasFormValues) {
    await applyFormValuesToPdf(pdf, {
      formValues,
      pdfFieldMap: args.pdfFieldMap,
      signatureDataUrl: args.isPreview ? undefined : args.signatureDataUrl,
      signerName: args.signerName,
      flatten: !args.isPreview,
    })

    if (args.documentPdfIds.length === 0) {
      await appendFormValuesSummaryPage(pdf, formValues, args.formFieldLabels ?? {})
    }
  }

  return pdf
}

export async function generateContractPreviewPdf(args: {
  payload: Payload
  documentPdfIds: (number | string)[]
  title: string
  bodyText?: string | null
  formValues?: Record<string, unknown> | null
  pdfFieldMap?: ContractPdfFieldMap | null
  formFieldLabels?: Record<string, string>
}): Promise<Uint8Array> {
  const pdf = await prepareContractPdf({ ...args, isPreview: true })
  return pdf.save()
}

async function buildBodyTextPdf(title: string, bodyText: string): Promise<PDFDocument> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const { height } = page.getSize()
  let y = height - 60

  page.drawText(sanitize(title), { x: 50, y, size: 18, font: bold, color: rgb(0.06, 0.09, 0.16) })
  y -= 40

  for (const line of wrapText(bodyText, 80)) {
    page.drawText(sanitize(line), { x: 50, y, size: 11, font, color: rgb(0.2, 0.25, 0.33) })
    y -= 16
    if (y < 120) break
  }

  return pdf
}

async function addPageFootersAsync(
  pdf: PDFDocument,
  args: { signerName: string; title: string; documentCount: number },
): Promise<void> {
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const pages = pdf.getPages()
  const totalWithAudit = pages.length + 1

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const { width } = page.getSize()
    const stampHeight = 28

    page.drawRectangle({ x: 0, y: 0, width, height: stampHeight, color: rgb(0.94, 0.95, 0.98) })
    page.drawRectangle({ x: 0, y: stampHeight, width, height: 1, color: BRAND })

    const line1 =
      args.documentCount > 1
        ? `${sanitize(args.title)}  |  ${args.documentCount} documents merged`
        : sanitize(args.title)
    page.drawText(line1, { x: 10, y: 17, size: 7, font: bold, color: BRAND })
    page.drawText(`Signer: ${sanitize(args.signerName)}`, { x: 10, y: 8, size: 6, font, color: MUTED })

    const pageLabel = `Page ${i + 1} of ${totalWithAudit}`
    const labelW = font.widthOfTextAtSize(pageLabel, 7)
    page.drawText(pageLabel, { x: width - labelW - 10, y: 12, size: 7, font, color: rgb(0.4, 0.4, 0.4) })
  }
}

export async function appendSignaturePage(
  pdf: PDFDocument,
  args: {
    title: string
    signerName: string
    signerEmail?: string | null
    signedAt: Date
    consentTimestamp?: string | null
    signatureMethod?: 'draw' | 'type'
    signaturePngBase64?: string
    documentCount: number
    ipAddress?: string | null
    userAgent?: string | null
    formValues?: Record<string, unknown> | null
    formFieldLabels?: Record<string, string>
    diditVerification?: DiditDecision | null
  },
): Promise<Uint8Array> {
  await addPageFootersAsync(pdf, {
    signerName: args.signerName,
    title: args.title,
    documentCount: args.documentCount,
  })

  const preAuditBytes = await pdf.save()
  const documentHash = createHash('sha256').update(preAuditBytes).digest('hex')

  const helvetica = await pdf.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const courier = await pdf.embedFont(StandardFonts.Courier)

  const W = 595.28
  const H = 841.89
  const auditPage = pdf.addPage([W, H])
  let y = H - 60

  auditPage.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: BRAND })
  auditPage.drawText('ELECTRONIC SIGNATURE RECORD', {
    x: 50,
    y: H - 42,
    size: 16,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })
  auditPage.drawText('This document is tamper-evident. Any alteration will invalidate this record.', {
    x: 50,
    y: H - 60,
    size: 8,
    font: helvetica,
    color: rgb(0.7, 0.8, 1),
  })
  y = H - 110

  let signatureImage = null
  if (args.signaturePngBase64) {
    try {
      const trimmed = await trimSignaturePng(args.signaturePngBase64)
      const b64 = trimmed.includes(',') ? trimmed.split(',')[1] : trimmed
      signatureImage = await pdf.embedPng(Buffer.from(b64, 'base64'))
      drawSignatureInBox(auditPage, signatureImage, CONTRACT_AUDIT_SIGNATURE_BOX)
      auditPage.drawRectangle({
        x: CONTRACT_AUDIT_SIGNATURE_BOX.x - 1,
        y: CONTRACT_AUDIT_SIGNATURE_BOX.y - 1,
        width: CONTRACT_AUDIT_SIGNATURE_BOX.width + 2,
        height: CONTRACT_AUDIT_SIGNATURE_BOX.height + 2,
        borderColor: BRAND,
        borderWidth: 1,
      })
      auditPage.drawText('Signature', { x: 447, y: y - 83, size: 7, font: helveticaBold, color: BRAND })
    } catch {
      // skip invalid signature image
    }
  }

  const signedLabel = args.signedAt.toLocaleString('en-AU', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Australia/Melbourne',
  })

  const consentLabel = args.consentTimestamp
    ? new Date(args.consentTimestamp).toLocaleString('en-AU', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Australia/Melbourne',
      })
    : signedLabel

  const rows: [string, string][] = [
    ['SIGNER', ''],
    ['Full Name', sanitize(args.signerName)],
    ['Email', sanitize(args.signerEmail ?? '')],
    ['', ''],
    ['CONTRACT', ''],
    ['Title', sanitize(args.title)],
    [
      'Documents',
      args.documentCount > 0
        ? `${args.documentCount} PDF${args.documentCount === 1 ? '' : 's'} merged into one package`
        : 'Text contract (generated PDF)',
    ],
  ]

  if (args.formValues) {
    const labels = args.formFieldLabels ?? {}
    for (const [key, value] of Object.entries(args.formValues)) {
      if (value == null || value === '') continue
      rows.push([labels[key] ?? key, sanitize(String(value))])
    }
  }

  if (args.diditVerification) {
    const v = args.diditVerification
    const sms = v.smsVerification
    const ip = v.ipAnalysis
    rows.push(
      ['', ''],
      ['IDENTITY VERIFICATION', ''],
      ['Provider', 'Didit (didit.me)'],
      ['Session ID', v.sessionId || 'N/A'],
      ['Status', v.status || 'N/A'],
      ['Verified Name', sanitize(v.verifiedName ?? '')],
      ['Method', v.features.includes('LIVENESS') ? 'Selfie biometric verification' : v.features.join(' + ') || 'N/A'],
      ['Liveness Score', v.livenessScore != null ? `${v.livenessScore}/100` : 'N/A'],
      ['Face Quality', v.faceQuality != null ? `${v.faceQuality}/100` : 'N/A'],
    )
    if (sms) {
      rows.push(
        ['', ''],
        ['SMS PHONE VERIFICATION', ''],
        ['Phone Number', sms.phoneNumber],
        ['Carrier', `${sms.carrier} (${sms.carrierType})`],
        ['Verified At', sms.verifiedAt || 'N/A'],
      )
    }
    if (ip) {
      rows.push(
        ['', ''],
        ['IP & DEVICE ANALYSIS', ''],
        ['IP Address', ip.ipAddress || 'N/A'],
        ['Location', `${ip.city}, ${ip.state}, ${ip.country}`],
        ['ISP', ip.isp || 'N/A'],
        ['Platform', `${ip.os} / ${ip.browser} (${ip.platform})`],
        ['VPN/Tor', ip.isVpn ? 'YES — VPN DETECTED' : 'No'],
      )
    }
  }

  rows.push(
    ['', ''],
    ['SIGNATURE', ''],
    ['Method', args.signatureMethod === 'type' ? 'Typed' : 'Drawn (canvas)'],
    ['Consent', sanitize(E_SIGN_CONSENT_TEXT)],
    ['Consent At', consentLabel],
    ['Signed At', signedLabel],
    ['', ''],
    ['SESSION', ''],
    ['IP Address', sanitize(args.ipAddress ?? 'N/A')],
    ['User Agent', sanitize((args.userAgent ?? 'N/A').substring(0, 120))],
    ['', ''],
    ['DOCUMENT INTEGRITY', ''],
    ['SHA-256 Hash', documentHash.substring(0, 44)],
    ['', documentHash.substring(44)],
    ['', ''],
    ['Legal Basis', 'Electronic Transactions Act 1999 (Cth)'],
  )

  for (const [label, value] of rows) {
    if (y < 80) break
    if (!label && !value) {
      y -= 8
      continue
    }
    if (!value) {
      auditPage.drawText(sanitize(label), { x: 50, y, size: 10, font: helveticaBold, color: BRAND })
      auditPage.drawRectangle({ x: 50, y: y - 3, width: 380, height: 0.5, color: rgb(0.8, 0.85, 1) })
    } else {
      auditPage.drawText(`${sanitize(label)}:`, {
        x: 50,
        y,
        size: 9,
        font: helveticaBold,
        color: rgb(0.4, 0.4, 0.4),
      })
      auditPage.drawText(sanitize(value), {
        x: 190,
        y,
        size: 9,
        font: label === 'SHA-256 Hash' || label === '' ? courier : helvetica,
        color: BODY,
      })
    }
    y -= 16
  }

  y -= 10
  auditPage.drawRectangle({ x: 40, y, width: 515, height: 0.5, color: rgb(0.7, 0.7, 0.7) })
  y -= 15
  auditPage.drawText(
    args.diditVerification
      ? 'Electronically signed under the Electronic Transactions Act 1999 (Cth). Identity verified by Didit (didit.me).'
      : 'Electronically signed under the Electronic Transactions Act 1999 (Cth). Financial Literacy Australia Staff Hub.',
    { x: 50, y, size: 7.5, font: helvetica, color: rgb(0.5, 0.5, 0.5) },
  )

  return pdf.save()
}

export async function generateSignedContractPackage(args: {
  payload: Payload
  title: string
  bodyText?: string | null
  documentPdfIds: (number | string)[]
  signerName: string
  signerEmail?: string | null
  signedAt: Date
  consentTimestamp?: string | null
  signatureMethod?: 'draw' | 'type'
  signaturePngBase64?: string
  ipAddress?: string | null
  userAgent?: string | null
  formValues?: Record<string, unknown> | null
  pdfFieldMap?: ContractPdfFieldMap | null
  formFieldLabels?: Record<string, string>
  diditVerification?: DiditDecision | null
}): Promise<Uint8Array> {
  const pdf = await prepareContractPdf({
    payload: args.payload,
    documentPdfIds: args.documentPdfIds,
    title: args.title,
    bodyText: args.bodyText,
    formValues: args.formValues,
    pdfFieldMap: args.pdfFieldMap,
    formFieldLabels: args.formFieldLabels,
    signatureDataUrl: args.signaturePngBase64,
    signerName: args.signerName,
  })

  return appendSignaturePage(pdf, {
    title: args.title,
    signerName: args.signerName,
    signerEmail: args.signerEmail,
    signedAt: args.signedAt,
    consentTimestamp: args.consentTimestamp,
    signatureMethod: args.signatureMethod,
    signaturePngBase64: args.signaturePngBase64,
    documentCount: args.documentPdfIds.length,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    formValues: args.formValues,
    formFieldLabels: args.formFieldLabels,
    diditVerification: args.diditVerification,
  })
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars) {
      if (current) lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}
