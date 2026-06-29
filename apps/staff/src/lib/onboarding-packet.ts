import { createHash } from 'node:crypto'

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Payload, PayloadRequest } from 'payload'

import type { ContractPdfFieldMap } from '@/lib/contract-form'
import { mergePdfDocuments, prepareContractPdf, resolveContractPdfIds } from '@/lib/contract-pdf'
import type { DiditDecision } from '@/lib/didit'
import { E_SIGN_CONSENT_TEXT } from '@/lib/esign-client'
import {
  buildSuperDocumentBytes,
  buildTaxDocumentBytes,
  type VaultPacketSection,
} from '@/lib/onboarding-documents'
import {
  hashOnboardingSummarySnapshot,
  type OnboardingSummary,
  parseOnboardingSummarySnapshot,
} from '@/lib/onboarding/onboarding-summary'
import { copyOfficialFormBytes } from '@/lib/pdf-form-fill'
import { readMediaBytes } from '@/lib/media-files'
import { relId } from '@/lib/payload-relations'
import {
  drawSignatureInBox,
  trimSignaturePng,
  type SignatureBox,
} from '@/lib/signature-image'
import type { StaffSignatureSource } from '@/lib/staff-signature'

const BRAND = rgb(0.08, 0.16, 0.36)
const MUTED = rgb(0.35, 0.35, 0.35)
const BODY = rgb(0.15, 0.15, 0.15)

export type PacketBuildMode = 'preview' | 'sign'

export type PacketSection = VaultPacketSection

export type GenerateOnboardingSignedPacketArgs = {
  mode: PacketBuildMode
  payload: Payload
  user: Record<string, unknown>
  contract: {
    id: string | number
    title: string
    bodyText?: string | null
    documentPdfs?: import('@/lib/contract-pdf').ContractDocumentRef[] | null
    templatePdf?: import('@/lib/contract-pdf').ContractDocumentRef | null
  }
  staffSignature?: StaffSignatureSource | null
  onboardingSummarySnapshot?: unknown
  onboardingConfirmedAt?: string | null
  signedAt?: Date
  consentTimestamp?: string | null
  signatureMethod?: 'draw' | 'type'
  formValues?: Record<string, unknown> | null
  pdfFieldMap?: ContractPdfFieldMap | null
  formFieldLabels?: Record<string, string>
  signerName: string
  signerEmail?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  diditVerification?: DiditDecision | null
  req?: PayloadRequest
}

export type GenerateOnboardingSignedPacketResult = {
  bytes: Uint8Array
  sections: PacketSection[]
  summarySnapshotHash: string | null
  documentHash: string
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(Buffer.from(bytes)).digest('hex')
}

function sanitize(value: string): string {
  return value.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim()
}

async function pdfPageCount(bytes: Uint8Array): Promise<number> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true })
  return pdf.getPageCount()
}

function superTaskUpdatesFromUser(user: Record<string, unknown>): Record<string, unknown> {
  const superChoiceData = (user.superChoiceData as Record<string, unknown> | undefined) ?? {}
  return {
    ...superChoiceData,
    superUseDefaultFund: user.superUseDefaultFund,
    superFundName: user.superFundName,
    superFundId: user.superFundId,
    superMemberNumber: user.superMemberNumber,
  }
}

async function loadCompletedPortalTaskTypes(
  payload: Payload,
  userId: string,
  req?: PayloadRequest,
): Promise<Set<string>> {
  const result = await payload.find({
    collection: 'onboarding-tasks',
    where: {
      and: [{ user: { equals: userId } }, { status: { equals: 'complete' } }],
    },
    limit: 100,
    overrideAccess: true,
    req,
  })
  return new Set(result.docs.map((doc) => String((doc as { type?: string }).type ?? '')))
}

const STATEMENT_TITLES: Record<'fwis' | 'ceis' | 'ftcis', string> = {
  fwis: 'Fair Work Information Statement (FWIS)',
  ceis: 'Casual Employment Information Statement (CEIS)',
  ftcis: 'Fixed Term Contract Information Statement (FTCIS)',
}

const STATEMENT_ACK_TEXT: Record<'fwis' | 'ceis' | 'ftcis', string> = {
  fwis: 'I acknowledge receipt of the Fair Work Information Statement (FWIS) shown above.',
  ceis: 'I acknowledge receipt of the Casual Employment Information Statement (CEIS) shown above.',
  ftcis: 'I acknowledge receipt of the Fixed Term Contract Information Statement (FTCIS) shown above.',
}

/** Signature box on onboarding summary declaration footer (last page). */
const ONBOARDING_SUMMARY_SIGNATURE_BOX: SignatureBox = {
  x: 595.28 - 200,
  y: 72,
  width: 130,
  height: 50,
}

/** Signature box on FWIS/CEIS/FTCIS acknowledgement pages. */
const STATEMENT_ACK_SIGNATURE_BOX: SignatureBox = {
  x: 50,
  y: 120,
  width: 160,
  height: 55,
}

/** Signature box on packet audit trail page. */
const PACKET_AUDIT_SIGNATURE_BOX: SignatureBox = {
  x: 420,
  y: 841.89 - 200,
  width: 130,
  height: 50,
}

async function embedSignatureOnPage(
  pdf: PDFDocument,
  pageIndex: number,
  dataUrl: string,
  box: SignatureBox,
): Promise<void> {
  const trimmed = await trimSignaturePng(dataUrl)
  const b64 = trimmed.includes(',') ? trimmed.split(',')[1] : trimmed
  const sigImage = await pdf.embedPng(Buffer.from(b64, 'base64'))
  drawSignatureInBox(pdf.getPage(pageIndex), sigImage, box)
}

export async function buildOnboardingSummaryPdf(args: {
  summary: OnboardingSummary
  signerName: string
  confirmedAt?: string | null
  signedAt?: Date | null
  staffSignature?: StaffSignatureSource | null
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const W = 595.28
  const H = 841.89
  const margin = 50
  let page = pdf.addPage([W, H])
  let y = H - margin

  const addPage = () => {
    page = pdf.addPage([W, H])
    y = H - margin
  }

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) addPage()
  }

  page.drawText('Employee information summary', { x: margin, y, size: 16, font: bold, color: BRAND })
  y -= 28
  page.drawText(`Prepared for: ${sanitize(args.signerName)}`, {
    x: margin,
    y,
    size: 10,
    font,
    color: MUTED,
  })
  y -= 24

  for (const section of args.summary.sections) {
    ensureSpace(40)
    page.drawText(sanitize(section.title), { x: margin, y, size: 12, font: bold, color: BRAND })
    y -= 18

    for (const row of section.rows) {
      ensureSpace(28)
      page.drawText(sanitize(row.label), { x: margin, y, size: 9, font: bold, color: MUTED })
      const valueLines = wrapText(sanitize(row.value || '—'), 70)
      for (const line of valueLines) {
        ensureSpace(14)
        page.drawText(line, { x: margin + 180, y, size: 9, font, color: BODY })
        y -= 14
      }
      y -= 6
    }
    y -= 8
  }

  ensureSpace(120)
  page.drawRectangle({
    x: margin - 4,
    y: y - 72,
    width: W - margin * 2 + 8,
    height: 88,
    borderColor: rgb(0.24, 0.42, 0.88),
    borderWidth: 1,
    color: rgb(0.96, 0.97, 1),
  })
  page.drawText('Declaration', { x: margin, y: y - 4, size: 11, font: bold, color: BRAND })
  y -= 22
  page.drawText('I confirm that all information shown above is true and correct.', {
    x: margin,
    y,
    size: 10,
    font,
    color: BODY,
  })
  y -= 16

  if (args.confirmedAt) {
    const confirmedLabel = new Date(args.confirmedAt).toLocaleString('en-AU', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Australia/Melbourne',
    })
    page.drawText(`Confirmed: ${confirmedLabel}`, { x: margin, y, size: 9, font, color: MUTED })
    y -= 14
  }

  if (args.signedAt) {
    const signedLabel = args.signedAt.toLocaleString('en-AU', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Australia/Melbourne',
    })
    page.drawText(`Signed: ${signedLabel}`, { x: margin, y, size: 9, font, color: MUTED })
  }

  if (args.staffSignature?.dataUrl) {
    await embedSignatureOnPage(
      pdf,
      pdf.getPageCount() - 1,
      args.staffSignature.dataUrl,
      ONBOARDING_SUMMARY_SIGNATURE_BOX,
    )
  }

  return pdf.save()
}

async function buildStatementWithAcknowledgement(args: {
  statementId: 'fwis' | 'ceis' | 'ftcis'
  signerName: string
  signedAt?: Date | null
  staffSignature?: StaffSignatureSource | null
}): Promise<{ bytes: Uint8Array; templateVersion: string }> {
  const copied = await copyOfficialFormBytes(args.statementId)
  const pdf = await PDFDocument.load(copied.bytes, { ignoreEncryption: true })
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const page = pdf.addPage([595.28, 841.89])
  let y = 780

  page.drawText('Acknowledgement of receipt', { x: 50, y, size: 14, font: bold, color: BRAND })
  y -= 28
  page.drawText(STATEMENT_TITLES[args.statementId], { x: 50, y, size: 11, font: bold, color: BODY })
  y -= 22
  for (const line of wrapText(STATEMENT_ACK_TEXT[args.statementId], 85)) {
    page.drawText(line, { x: 50, y, size: 10, font, color: BODY })
    y -= 16
  }
  y -= 10
  page.drawText(`Employee: ${sanitize(args.signerName)}`, { x: 50, y, size: 10, font, color: BODY })
  y -= 16
  if (args.signedAt) {
    page.drawText(
      `Date: ${args.signedAt.toLocaleDateString('en-AU', { timeZone: 'Australia/Melbourne' })}`,
      { x: 50, y, size: 10, font, color: BODY },
    )
  }

  if (args.staffSignature?.dataUrl) {
    await embedSignatureOnPage(
      pdf,
      pdf.getPageCount() - 1,
      args.staffSignature.dataUrl,
      STATEMENT_ACK_SIGNATURE_BOX,
    )
  }

  return { bytes: await pdf.save(), templateVersion: copied.templateVersion }
}

async function prependTableOfContents(
  bodyBytes: Uint8Array,
  sections: Array<{ title: string; pageCount: number }>,
  signerName: string,
): Promise<Uint8Array> {
  const bodyPdf = await PDFDocument.load(bodyBytes, { ignoreEncryption: true })
  const output = await PDFDocument.create()
  const font = await output.embedFont(StandardFonts.Helvetica)
  const bold = await output.embedFont(StandardFonts.HelveticaBold)

  const tocPage = output.addPage([595.28, 841.89])
  let y = 780
  tocPage.drawText('Onboarding document package', { x: 50, y, size: 16, font: bold, color: BRAND })
  y -= 24
  tocPage.drawText(`Employee: ${sanitize(signerName)}`, { x: 50, y, size: 10, font, color: MUTED })
  y -= 30
  tocPage.drawText('Contents', { x: 50, y, size: 12, font: bold, color: BRAND })
  y -= 22

  let pageNumber = 2
  for (const section of sections) {
    tocPage.drawText(section.title, { x: 50, y, size: 10, font, color: BODY })
    tocPage.drawText(String(pageNumber), { x: 500, y, size: 10, font, color: MUTED })
    y -= 16
    pageNumber += section.pageCount
  }

  const tocPages = await output.copyPages(bodyPdf, bodyPdf.getPageIndices())
  for (const page of tocPages) {
    output.addPage(page)
  }

  return output.save()
}

async function appendOnboardingPacketAuditPage(
  pdf: PDFDocument,
  args: {
    signerName: string
    signerEmail?: string | null
    signedAt: Date
    consentTimestamp?: string | null
    signatureMethod?: 'draw' | 'type'
    signaturePngBase64?: string
    ipAddress?: string | null
    userAgent?: string | null
    diditVerification?: DiditDecision | null
    sections: PacketSection[]
    summarySnapshotHash?: string | null
  },
): Promise<{ bytes: Uint8Array; preAuditDocumentHash: string }> {
  const preAuditBytes = await pdf.save()
  const preAuditDocumentHash = sha256(preAuditBytes)

  const helvetica = await pdf.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const courier = await pdf.embedFont(StandardFonts.Courier)

  const W = 595.28
  const H = 841.89
  const auditPage = pdf.addPage([W, H])
  let y = H - 60

  auditPage.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: BRAND })
  auditPage.drawText('ONBOARDING PACKET — ELECTRONIC SIGNATURE RECORD', {
    x: 50,
    y: H - 42,
    size: 14,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  const signedLabel = args.signedAt.toLocaleString('en-AU', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Australia/Melbourne',
  })

  const rows: [string, string][] = [
    ['SIGNER', ''],
    ['Full Name', sanitize(args.signerName)],
    ['Email', sanitize(args.signerEmail ?? '')],
    ['', ''],
    ['INCLUDED SECTIONS', ''],
    ...args.sections.map(
      (section) => [section.title, section.contentHash.slice(0, 16) + '…'] as [string, string],
    ),
  ]

  if (args.summarySnapshotHash) {
    rows.push(['', ''], ['Summary snapshot hash', args.summarySnapshotHash])
  }

  if (args.diditVerification) {
    const v = args.diditVerification
    rows.push(
      ['', ''],
      ['IDENTITY VERIFICATION', ''],
      ['Provider', 'Didit (didit.me)'],
      ['Session ID', v.sessionId || 'N/A'],
      ['Status', v.status || 'N/A'],
      ['Verified Name', sanitize(v.verifiedName ?? '')],
    )
  }

  const consentLabel = args.consentTimestamp
    ? new Date(args.consentTimestamp).toLocaleString('en-AU', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Australia/Melbourne',
      })
    : signedLabel

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
    ['SHA-256 Hash', preAuditDocumentHash.substring(0, 44)],
    ['', preAuditDocumentHash.substring(44)],
  )

  for (const [label, value] of rows) {
    if (y < 80) break
    if (!label && !value) {
      y -= 8
      continue
    }
    auditPage.drawText(`${sanitize(label)}${value ? ':' : ''}`, {
      x: 50,
      y,
      size: label && !value ? 10 : 9,
      font: helveticaBold,
      color: label && !value ? BRAND : rgb(0.4, 0.4, 0.4),
    })
    if (value) {
      auditPage.drawText(sanitize(value), {
        x: 190,
        y,
        size: 9,
        font: label === 'SHA-256 Hash' || label === '' ? courier : helvetica,
        color: BODY,
      })
    }
    y -= 14
  }

  if (args.signaturePngBase64) {
    try {
      const trimmed = await trimSignaturePng(args.signaturePngBase64)
      const b64 = trimmed.includes(',') ? trimmed.split(',')[1] : trimmed
      const sigImage = await pdf.embedPng(Buffer.from(b64, 'base64'))
      drawSignatureInBox(auditPage, sigImage, PACKET_AUDIT_SIGNATURE_BOX)
    } catch {
      // skip invalid signature
    }
  }

  return { bytes: await pdf.save(), preAuditDocumentHash }
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
  return lines.length > 0 ? lines : ['']
}

export async function generateOnboardingSignedPacket(
  args: GenerateOnboardingSignedPacketArgs,
): Promise<GenerateOnboardingSignedPacketResult> {
  const userId = String(args.user.id)
  const signedAt = args.signedAt ?? new Date()
  const signMode = args.mode === 'sign'
  const staffSignature = signMode ? (args.staffSignature ?? null) : null
  const summary = parseOnboardingSummarySnapshot(args.onboardingSummarySnapshot)
  const summarySnapshotHash = summary ? hashOnboardingSummarySnapshot(summary) : null

  const completedTasks = await loadCompletedPortalTaskTypes(args.payload, userId, args.req)
  const documentPdfIds = await resolveContractPdfIds(args.contract)
  const sections: PacketSection[] = []

  const contractPdf = await prepareContractPdf({
    payload: args.payload,
    documentPdfIds,
    title: args.contract.title,
    bodyText: args.contract.bodyText,
    formValues: args.formValues,
    pdfFieldMap: args.pdfFieldMap,
    formFieldLabels: args.formFieldLabels,
    isPreview: !signMode,
    signatureDataUrl: signMode ? staffSignature?.dataUrl : undefined,
    signerName: args.signerName,
  })
  const contractBytes = await contractPdf.save()
  sections.push({
    id: 'contract',
    title: args.contract.title,
    documentType: 'contract_signed',
    fileName: `contract-${args.contract.id}-signed.pdf`,
    bytes: contractBytes,
    contentHash: sha256(contractBytes),
  })

  if (summary) {
    const summaryBytes = await buildOnboardingSummaryPdf({
      summary,
      signerName: args.signerName,
      confirmedAt: args.onboardingConfirmedAt,
      signedAt: signMode ? signedAt : null,
      staffSignature,
    })
    sections.push({
      id: 'summary',
      title: 'Employee information summary',
      documentType: 'onboarding_packet',
      fileName: `onboarding-summary-${userId}.pdf`,
      bytes: summaryBytes,
      contentHash: sha256(summaryBytes),
      metadata: { summarySnapshotHash },
    })
  }

  const taxDeclaration = (args.user.taxDeclaration as Record<string, unknown> | undefined) ?? {}
  if (
    completedTasks.has('tax')
    && String(args.user.taxSetupStatus ?? '') === 'employee_confirmed'
  ) {
    const built = await buildTaxDocumentBytes(args.payload, {
      user: args.user,
      taskUpdates: taxDeclaration,
      staffSignature: signMode ? staffSignature : null,
      req: args.req,
    })
    sections.push({
      id: 'nat3092',
      title: built.nat3092.title,
      documentType: 'tax_setup',
      fileName: built.nat3092.fileName,
      bytes: built.nat3092.bytes,
      contentHash: built.nat3092.contentHash,
      metadata: { formId: 'nat3092', templateVersion: built.nat3092.templateVersion },
    })
    sections.push({
      id: 'nat3093',
      title: built.nat3093.title,
      documentType: 'tax_setup',
      fileName: built.nat3093.fileName,
      bytes: built.nat3093.bytes,
      contentHash: built.nat3093.contentHash,
      metadata: { formId: 'nat3093', templateVersion: built.nat3093.templateVersion },
    })
  }

  if (completedTasks.has('super') && String(args.user.superChoiceStatus ?? '') === 'submitted') {
    const built = await buildSuperDocumentBytes(args.payload, {
      user: args.user,
      taskUpdates: superTaskUpdatesFromUser(args.user),
      staffSignature: signMode ? staffSignature : null,
      req: args.req,
    })
    sections.push({
      id: 'nat13080',
      title: built.nat13080.title,
      documentType: 'super_choice',
      fileName: built.nat13080.fileName,
      bytes: built.nat13080.bytes,
      contentHash: built.nat13080.contentHash,
      metadata: { formId: 'nat13080', templateVersion: built.nat13080.templateVersion },
    })
  }

  if (completedTasks.has('fwis')) {
    const employmentBasis = String(args.user.employmentBasis ?? 'casual')
    const statementIds: Array<'fwis' | 'ceis' | 'ftcis'> = ['fwis', 'ceis']
    if (employmentBasis === 'fixed_term') statementIds.push('ftcis')

    for (const statementId of statementIds) {
      const built = await buildStatementWithAcknowledgement({
        statementId,
        signerName: args.signerName,
        signedAt: signMode ? signedAt : null,
        staffSignature,
      })
      sections.push({
        id: statementId,
        title: STATEMENT_TITLES[statementId],
        documentType: 'fwis_ack',
        fileName: `${statementId}-${userId}.pdf`,
        bytes: built.bytes,
        contentHash: sha256(built.bytes),
        metadata: { statementId, templateVersion: built.templateVersion },
      })
    }
  }

  const complianceMediaId = relId(args.user.superComplianceLetter)
  if (complianceMediaId) {
    try {
      const complianceBytes = await readMediaBytes(args.payload, complianceMediaId)
      await PDFDocument.load(complianceBytes, { ignoreEncryption: true })
      sections.push({
        id: 'compliance',
        title: 'Super fund letter of compliance',
        documentType: 'compliance',
        fileName: `compliance-${userId}.pdf`,
        bytes: complianceBytes,
        contentHash: sha256(complianceBytes),
      })
    } catch {
      // Non-PDF compliance uploads are skipped in the merged packet.
    }
  }

  const merged = await mergePdfDocuments(sections.map((section) => section.bytes))
  let mergedBytes = await merged.save()
  let preAuditDocumentHash: string | null = null

  const tocSections: Array<{ title: string; pageCount: number }> = []
  for (const section of sections) {
    tocSections.push({ title: section.title, pageCount: await pdfPageCount(section.bytes) })
  }
  mergedBytes = await prependTableOfContents(mergedBytes, tocSections, args.signerName)

  if (signMode) {
    const withAudit = await PDFDocument.load(mergedBytes, { ignoreEncryption: true })
    const audited = await appendOnboardingPacketAuditPage(withAudit, {
      signerName: args.signerName,
      signerEmail: args.signerEmail,
      signedAt,
      consentTimestamp: args.consentTimestamp,
      signatureMethod: args.signatureMethod,
      signaturePngBase64: staffSignature?.dataUrl,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      diditVerification: args.diditVerification,
      sections,
      summarySnapshotHash,
    })
    mergedBytes = audited.bytes
    preAuditDocumentHash = audited.preAuditDocumentHash
  }

  return {
    bytes: mergedBytes,
    sections,
    summarySnapshotHash,
    documentHash: preAuditDocumentHash ?? sha256(mergedBytes),
  }
}
