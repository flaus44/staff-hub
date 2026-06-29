import { createHash } from 'node:crypto'

import type { Payload, PayloadRequest } from 'payload'

import { relId, relIdNumber } from '@/lib/payload-relations'
import { copyOfficialFormBytes } from '@/lib/pdf-form-fill'
import {
  NAT3092_SIGNATURE_PLACEMENT,
} from '@/lib/onboarding-pdf/field-maps/nat3092'
import {
  NAT3093_MEDICARE_EXEMPTION_EXPORTS,
  NAT3093_RESIDENCY_EXPORTS,
  NAT3093_YES_NO_EXPORT,
  resolveNat309TitleExport,
} from '@/lib/onboarding-pdf/field-maps/nat3093-radio-values'
import {
  NAT3093_SIGNATURE_PLACEMENT,
} from '@/lib/onboarding-pdf/field-maps/nat3093'
import {
  resolveNat13080SignatureAnchorFieldNames,
  resolveNat13080SuperChoiceExport,
} from '@/lib/onboarding-pdf/field-maps/nat13080'
import {
  generateNat13080Pdf,
  generateNat3092Pdf,
  generateNat3093Pdf,
} from '@/lib/onboarding-pdf/generate-official-forms'
import { resolveStaffContractSignature, type StaffSignatureSource } from '@/lib/staff-signature'
import { decryptTfn } from '@/lib/tfn-encryption'

type OnboardingDocumentType =
  | 'contract_signed'
  | 'fwis_ack'
  | 'super_choice'
  | 'tax_setup'
  | 'compliance'
  | 'payroll_packet'
  | 'onboarding_packet'

type IssueDocumentInput = {
  userId: string
  assignmentId?: string | null
  taskId?: string | null
  title: string
  documentType: OnboardingDocumentType
  fileName: string
  bytes: Uint8Array
  metadata?: Record<string, unknown>
  issuedAt?: string
  classification?: 'contract' | 'onboarding_pii' | 'general'
  req?: PayloadRequest
}

type OrgSettingsSnapshot = {
  employerLegalName?: string
  employerTradingName?: string
  employerAbn?: string
  employerAddressLine1?: string
  employerAddressLine2?: string
  employerAddressSuburb?: string
  employerAddressState?: string
  employerAddressPostcode?: string
  employerBusinessAddress?: string
  payerBranchNumber?: string
  payrollContactName?: string
  payrollContactPhone?: string
  payrollContactEmail?: string
  authorizedSignatoryName?: string
  authorizedSignatoryTitle?: string
  payerDeclarationDatePolicy?: 'auto' | 'manual'
  defaultSuperFundName?: string
  defaultSuperFundUsi?: string
  defaultSuperFundAbn?: string
}

function stringify(value: unknown): string {
  return value == null ? '' : String(value)
}

/** Auth email is always on the session; findByID can omit it in some request contexts. */
function resolveStaffUserEmail(
  user: Record<string, unknown>,
  req?: PayloadRequest,
): string {
  const fromRecord = stringify(user.email).trim().toLowerCase()
  if (fromRecord) return fromRecord
  const sessionUser = req?.user as { email?: string | null } | undefined
  return stringify(sessionUser?.email).trim().toLowerCase()
}

export function mergeStaffUserForFormFill(
  user: Record<string, unknown>,
  sessionUser?: { email?: string | null; profile?: unknown } | null,
): Record<string, unknown> {
  return {
    ...user,
    email: user.email ?? sessionUser?.email ?? '',
    profile: {
      ...((sessionUser?.profile as Record<string, unknown> | undefined) ?? {}),
      ...((user.profile as Record<string, unknown> | undefined) ?? {}),
    },
  }
}

function relationToNumber(value: unknown): number | null {
  return relIdNumber(value)
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(Buffer.from(bytes)).digest('hex')
}

type SignedFormIssueMetadata = {
  signed: boolean
  contractSignatureId?: string
  signedAt?: string | null
}

function formIssueMetadata(
  doc: BuiltDocumentBytes,
  issue: SignedFormIssueMetadata,
): Record<string, unknown> {
  return {
    formId: doc.formId,
    templateVersion: doc.templateVersion,
    generationMode: issue.signed ? 'signed' : 'pending_signature',
    contentHash: doc.contentHash,
    ...(issue.signed && issue.contractSignatureId
      ? { contractSignatureId: issue.contractSignatureId }
      : {}),
    ...(issue.signed && issue.signedAt ? { signedAt: issue.signedAt } : {}),
  }
}

export function formIssueFromStaffSignature(
  staffSignature: StaffSignatureSource | null,
): SignedFormIssueMetadata {
  if (!staffSignature) return { signed: false }
  return {
    signed: true,
    contractSignatureId: staffSignature.id,
    signedAt: staffSignature.signedAt,
  }
}

/** Official tax/super PDFs are staff-downloadable only after contract signature is embedded. */
export function isStaffDownloadableOnboardingDocument(doc: {
  documentType?: string | null
  metadata?: unknown
}): boolean {
  const documentType = String(doc.documentType ?? '')
  if (documentType === 'onboarding_packet') return true
  if (documentType !== 'tax_setup' && documentType !== 'super_choice') return true
  const metadata =
    doc.metadata && typeof doc.metadata === 'object' ? (doc.metadata as Record<string, unknown>) : {}
  return metadata.generationMode === 'signed'
}

async function getOrgSettings(payload: Payload, req?: PayloadRequest): Promise<OrgSettingsSnapshot> {
  const settings = (await payload.findGlobal({
    slug: 'org-settings',
    depth: 0,
    overrideAccess: true,
    req,
  })) as Record<string, unknown>
  return {
    employerLegalName: stringify(settings.employerLegalName),
    employerTradingName: stringify(settings.employerTradingName),
    employerAbn: stringify(settings.employerAbn),
    employerAddressLine1: stringify(settings.employerAddressLine1),
    employerAddressLine2: stringify(settings.employerAddressLine2),
    employerAddressSuburb: stringify(settings.employerAddressSuburb),
    employerAddressState: stringify(settings.employerAddressState),
    employerAddressPostcode: stringify(settings.employerAddressPostcode),
    employerBusinessAddress: stringify(settings.employerBusinessAddress),
    payerBranchNumber: stringify(settings.payerBranchNumber),
    payrollContactName: stringify(settings.payrollContactName),
    payrollContactPhone: stringify(settings.payrollContactPhone),
    payrollContactEmail: stringify(settings.payrollContactEmail),
    authorizedSignatoryName: stringify(settings.authorizedSignatoryName),
    authorizedSignatoryTitle: stringify(settings.authorizedSignatoryTitle),
    payerDeclarationDatePolicy:
      settings.payerDeclarationDatePolicy === 'manual' ? 'manual' : 'auto',
    defaultSuperFundName: stringify(settings.defaultSuperFundName),
    defaultSuperFundUsi: stringify(settings.defaultSuperFundUsi),
    defaultSuperFundAbn: stringify(settings.defaultSuperFundAbn),
  }
}

async function existingDocumentByHash(
  payload: Payload,
  userId: string,
  contentSha256: string,
  req?: PayloadRequest,
) {
  const docs = await payload.find({
    collection: 'onboarding-documents',
    where: {
      and: [
        { user: { equals: userId } },
        { 'metadata.contentSha256': { equals: contentSha256 } },
      ],
    },
    limit: 1,
    overrideAccess: true,
    req,
  })
  return docs.docs[0] ?? null
}

export async function issueOnboardingDocument(
  payload: Payload,
  input: IssueDocumentInput,
): Promise<string> {
  const contentSha256 = sha256(input.bytes)
  const existing = await existingDocumentByHash(payload, input.userId, contentSha256, input.req)
  if (existing) return String(existing.id)

  const fileBuffer = Buffer.from(input.bytes)
  const media = await payload.create({
    collection: 'media',
    data: {
      alt: input.title,
      classification: input.classification ?? 'onboarding_pii',
    },
    file: {
      data: fileBuffer,
      mimetype: 'application/pdf',
      name: input.fileName,
      size: fileBuffer.length,
    },
    req: input.req,
  })

  const created = await payload.create({
    collection: 'onboarding-documents',
    data: {
      user: relationToNumber(input.userId),
      assignment: relationToNumber(input.assignmentId),
      task: relationToNumber(input.taskId),
      title: input.title,
      documentType: input.documentType,
      media: relationToNumber(media.id),
      issuedAt: input.issuedAt ?? new Date().toISOString(),
      metadata: {
        ...(input.metadata ?? {}),
        contentSha256,
      },
    },
    overrideAccess: true,
    req: input.req,
  })

  return String(created.id)
}

function buildEmploymentBasisChecks(basis: string) {
  const map: Record<string, string> = {
    full_time: 'full-time',
    part_time: 'part-time',
    casual: 'casual',
    labour_hire: 'labour',
    fixed_term: 'super',
  }
  return map[basis] ?? map.casual
}

/** Split a Payload date (ISO string or Date) into DD/MM/YYYY comb parts. */
function splitDateParts(value: unknown): { day: string; month: string; year: string } {
  if (value == null) return { day: '', month: '', year: '' }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return { day: '', month: '', year: '' }
    return {
      year: String(value.getUTCFullYear()),
      month: String(value.getUTCMonth() + 1).padStart(2, '0'),
      day: String(value.getUTCDate()).padStart(2, '0'),
    }
  }

  const text = String(value).trim()
  if (!text) return { day: '', month: '', year: '' }

  const isoPrefix = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
  if (isoPrefix) {
    return { year: isoPrefix[1], month: isoPrefix[2], day: isoPrefix[3] }
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    return {
      year: String(parsed.getUTCFullYear()),
      month: String(parsed.getUTCMonth() + 1).padStart(2, '0'),
      day: String(parsed.getUTCDate()).padStart(2, '0'),
    }
  }

  return { day: '', month: '', year: '' }
}

/** DD/MM/YYYY parts in Australia/Sydney for payee declaration dates on signed forms. */
function splitAustralianDateParts(source?: string | null): { day: string; month: string; year: string } {
  if (!source) return { day: '', month: '', year: '' }
  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return { day: '', month: '', year: '' }
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date)
  return {
    day: parts.find((part) => part.type === 'day')?.value ?? '',
    month: parts.find((part) => part.type === 'month')?.value ?? '',
    year: parts.find((part) => part.type === 'year')?.value ?? '',
  }
}

function resolvePayeeDeclarationDate(
  staffSignature: StaffSignatureSource | null,
): { day: string; month: string; year: string } {
  if (!staffSignature) return { day: '', month: '', year: '' }
  if (staffSignature.signedAt) return splitAustralianDateParts(staffSignature.signedAt)
  return splitAustralianDateParts(new Date().toISOString())
}

const DEFAULT_PAYER_CONTACT_EMAIL = 'accounts@flaus.com.au'

function normalizePayerPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10)
}

function splitCombLines(value: string, maxLines: number, maxCharsPerLine: number): string[] {
  const compact = value.replace(/\s+/g, '').trim()
  const lines: string[] = []
  for (let i = 0; i < maxLines; i++) {
    const start = i * maxCharsPerLine
    const slice = compact.slice(start, start + maxCharsPerLine)
    if (!slice) break
    lines.push(slice)
  }
  return lines
}

function splitNameLines(value: string, maxLines = 3, maxCharsPerLine = 32): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxCharsPerLine) {
      current = next
      continue
    }
    if (current) lines.push(current)
    current = word
    if (lines.length === maxLines) break
  }
  if (current && lines.length < maxLines) lines.push(current)
  while (lines.length < maxLines) lines.push('')
  return lines.slice(0, maxLines)
}

function toYesNoExport(value: boolean): string {
  return value ? NAT3093_YES_NO_EXPORT.yes : NAT3093_YES_NO_EXPORT.no
}

function resolveMedicareExemptionExport(value: unknown): string {
  if (typeof value === 'boolean') {
    return value
      ? NAT3093_MEDICARE_EXEMPTION_EXPORTS.single
      : NAT3093_MEDICARE_EXEMPTION_EXPORTS.none
  }
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized in NAT3093_MEDICARE_EXEMPTION_EXPORTS) {
    return NAT3093_MEDICARE_EXEMPTION_EXPORTS[
      normalized as keyof typeof NAT3093_MEDICARE_EXEMPTION_EXPORTS
    ]
  }
  return NAT3093_MEDICARE_EXEMPTION_EXPORTS.none
}

function resolveTaxTfn(
  user: Record<string, unknown>,
  taskUpdates: Record<string, unknown>,
): string {
  const incoming = String(taskUpdates.tfn ?? '').trim()
  if (incoming) return incoming
  const tfnEncrypted = user.tfnEncrypted as
    | { iv: string; authTag: string; value: string }
    | undefined
  return tfnEncrypted ? decryptTfn(tfnEncrypted) : ''
}

export type BuiltDocumentBytes = {
  formId: 'nat3092' | 'nat3093' | 'nat13080'
  title: string
  documentType: OnboardingDocumentType
  fileName: string
  templateVersion: string
  bytes: Uint8Array
  contentHash: string
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    )
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function verificationHash(args: {
  formId: BuiltDocumentBytes['formId']
  templateVersion: string
  values: Record<string, unknown>
}): string {
  return createHash('sha256')
    .update(stableSerialize(args))
    .digest('hex')
}

function withHash<T extends Omit<BuiltDocumentBytes, 'contentHash'> & { values: Record<string, unknown> }>(
  doc: T,
): BuiltDocumentBytes {
  const { values, ...rest } = doc
  return {
    ...rest,
    contentHash: verificationHash({
      formId: doc.formId,
      templateVersion: doc.templateVersion,
      values,
    }),
  }
}

export async function buildTaxDocumentBytes(
  payload: Payload,
  args: {
    user: Record<string, unknown>
    taskUpdates?: Record<string, unknown>
    staffSignature?: StaffSignatureSource | null
    req?: PayloadRequest
  },
): Promise<{ nat3092: BuiltDocumentBytes; nat3093: BuiltDocumentBytes }> {
  const profile = (args.user.profile as Record<string, unknown> | undefined) ?? {}
  const settings = await getOrgSettings(payload, args.req)
  const taskUpdates = args.taskUpdates ?? {}
  const firstName = stringify(args.user.firstName)
  const lastName = stringify(args.user.lastName)
  const otherGivenNames = stringify(profile.otherGivenNames)
  const payeeEmail = resolveStaffUserEmail(args.user, args.req)
  const payeeEmailLines = splitCombLines(payeeEmail, 2, 19)
  const declarationDate = splitDateParts(new Date().toISOString().slice(0, 10))
  const dob = splitDateParts(profile.dateOfBirth)

  const staffSignature =
    args.staffSignature !== undefined
      ? args.staffSignature
      : await resolveStaffContractSignature(payload, {
          userId: stringify(args.user.id),
          req: args.req,
        })
  const payeeDeclarationDate = resolvePayeeDeclarationDate(staffSignature)
  const payerNameLines = splitNameLines(stringify(settings.employerLegalName), 3, 19)
  const payerEmail = stringify(settings.payrollContactEmail) || DEFAULT_PAYER_CONTACT_EMAIL
  const payerEmailLines = splitCombLines(payerEmail, 2, 19)
  const payerContactName = stringify(settings.payrollContactName).slice(0, 19)
  const payerDeclarationDate =
    settings.payerDeclarationDatePolicy === 'auto' ? declarationDate : { day: '', month: '', year: '' }
  const employmentBasis = stringify(args.user.employmentBasis) || 'casual'
  const tfn = resolveTaxTfn(args.user, taskUpdates)
  const titleExport = resolveNat309TitleExport(profile.title ?? taskUpdates.title)
  const residencyStatus = stringify(taskUpdates.residencyStatus) || 'australian_resident'
  const hasStudyLoanDebt =
    Boolean(taskUpdates.hasHelpDebt)
    || Boolean(taskUpdates.hasSslDebt)
    || Boolean(taskUpdates.hasTslDebt)
    || Boolean(taskUpdates.hasVslDebt)
  const hasFinancialSupplementDebt = Boolean(taskUpdates.hasSfssDebt)
  const hasStudyDebt =
    hasStudyLoanDebt
    || hasFinancialSupplementDebt

  const signaturePlacement = staffSignature
    ? {
        dataUrl: staffSignature.dataUrl,
        placements: [NAT3092_SIGNATURE_PLACEMENT],
      }
    : undefined

  const nat3092Pdf = await generateNat3092Pdf({
    text: {
      payeeSurname: lastName,
      payeeGivenNames: firstName,
      payeeOtherGivenNames: otherGivenNames,
      dateOfBirthDay: dob.day,
      dateOfBirthMonth: dob.month,
      dateOfBirthYear: dob.year,
      addressLine1: stringify(profile.addressLine1),
      addressLine2: stringify(profile.addressLine2),
      payeeEmailLine1: payeeEmailLines[0],
      payeeEmailLine2: payeeEmailLines[1],
      suburb: stringify(profile.suburb),
      state: stringify(profile.state),
      postcode: stringify(profile.postcode),
      tfn,
      payerNameLine1: payerNameLines[0],
      payerNameLine2: payerNameLines[1],
      payerNameLine3: payerNameLines[2],
      payerAbn: settings.employerAbn,
      payerBranch: settings.payerBranchNumber,
      payerEmailLine1: payerEmailLines[0],
      payerEmailLine2: payerEmailLines[1],
      payerContactName,
      payerContactPhone: normalizePayerPhone(settings.payrollContactPhone),
      payerAddressLine1: settings.employerAddressLine1,
      payerAddressLine2: settings.employerAddressLine2,
      payerAddressSuburb: settings.employerAddressSuburb,
      payerAddressState: settings.employerAddressState,
      payerAddressPostcode: settings.employerAddressPostcode,
    },
    checkboxes: {},
    checkboxExports: {
      title: titleExport,
      employmentBasis: buildEmploymentBasisChecks(employmentBasis),
      residencyStatus:
        residencyStatus === 'working_holiday_maker'
          ? 'working#20holiday#20maker'
          : residencyStatus === 'foreign_resident'
            ? 'foreign#20resident'
            : 'Aust#20resident',
      claimTaxFreeThreshold: Boolean(taskUpdates.claimTaxFreeThreshold) ? 'yes' : 'no',
      hasStudyDebt: hasStudyDebt ? 'yes' : 'no',
    },
    signature: signaturePlacement,
  })
  const nat3092Values = {
    text: {
      payeeSurname: lastName,
      payeeGivenNames: firstName,
      payeeOtherGivenNames: otherGivenNames,
      dateOfBirthDay: dob.day,
      dateOfBirthMonth: dob.month,
      dateOfBirthYear: dob.year,
      addressLine1: stringify(profile.addressLine1),
      addressLine2: stringify(profile.addressLine2),
      payeeEmailLine1: payeeEmailLines[0],
      payeeEmailLine2: payeeEmailLines[1],
      suburb: stringify(profile.suburb),
      state: stringify(profile.state),
      postcode: stringify(profile.postcode),
      tfn,
      payerNameLine1: payerNameLines[0],
      payerNameLine2: payerNameLines[1],
      payerNameLine3: payerNameLines[2],
      payerAbn: settings.employerAbn,
      payerBranch: settings.payerBranchNumber,
      payerEmailLine1: payerEmailLines[0],
      payerEmailLine2: payerEmailLines[1],
      payerContactName,
      payerContactPhone: normalizePayerPhone(settings.payrollContactPhone),
      payerAddressLine1: settings.employerAddressLine1,
      payerAddressLine2: settings.employerAddressLine2,
      payerAddressSuburb: settings.employerAddressSuburb,
      payerAddressState: settings.employerAddressState,
      payerAddressPostcode: settings.employerAddressPostcode,
    },
    checkboxExports: {
      title: titleExport,
      employmentBasis: buildEmploymentBasisChecks(employmentBasis),
      residencyStatus:
        residencyStatus === 'working_holiday_maker'
          ? 'working#20holiday#20maker'
          : residencyStatus === 'foreign_resident'
            ? 'foreign#20resident'
            : 'Aust#20resident',
      claimTaxFreeThreshold: Boolean(taskUpdates.claimTaxFreeThreshold) ? 'yes' : 'no',
      hasStudyDebt: hasStudyDebt ? 'yes' : 'no',
    },
  }

  const nat3093SignaturePlacement = staffSignature
    ? {
        dataUrl: staffSignature.dataUrl,
        placements: [NAT3093_SIGNATURE_PLACEMENT],
      }
    : undefined

  const nat3093Pdf = await generateNat3093Pdf({
    text: {
      surname: lastName,
      givenNames: firstName,
      otherGivenNames,
      dateOfBirthDay: dob.day,
      dateOfBirthMonth: dob.month,
      dateOfBirthYear: dob.year,
      tfn,
      payerAbn: settings.employerAbn,
      payerName: settings.employerLegalName,
      declarationDateDay: payeeDeclarationDate.day,
      declarationDateMonth: payeeDeclarationDate.month,
      declarationDateYear: payeeDeclarationDate.year,
      payerDeclarationDateDay: payerDeclarationDate.day,
      payerDeclarationDateMonth: payerDeclarationDate.month,
      payerDeclarationDateYear: payerDeclarationDate.year,
    },
    checkboxes: {
      Qtfn: Boolean(tfn),
    },
    checkboxExports: {
      title: titleExport,
      residencyStatus: NAT3093_RESIDENCY_EXPORTS[residencyStatus] ?? NAT3093_RESIDENCY_EXPORTS.australian_resident,
      claimTaxFreeThreshold: toYesNoExport(Boolean(taskUpdates.claimTaxFreeThreshold)),
      hasStudyLoanDebt: toYesNoExport(hasStudyLoanDebt),
      hasFinancialSupplementDebt: toYesNoExport(hasFinancialSupplementDebt),
      hasStudyDebt: toYesNoExport(hasStudyDebt),
      medicareExemption: resolveMedicareExemptionExport(taskUpdates.medicareExemption),
    },
    signature: nat3093SignaturePlacement,
  })
  const nat3093Values = {
    text: {
      surname: lastName,
      givenNames: firstName,
      otherGivenNames,
      dateOfBirthDay: dob.day,
      dateOfBirthMonth: dob.month,
      dateOfBirthYear: dob.year,
      tfn,
      payerAbn: settings.employerAbn,
      payerName: settings.employerLegalName,
      declarationDateDay: payeeDeclarationDate.day,
      declarationDateMonth: payeeDeclarationDate.month,
      declarationDateYear: payeeDeclarationDate.year,
      payerDeclarationDateDay: payerDeclarationDate.day,
      payerDeclarationDateMonth: payerDeclarationDate.month,
      payerDeclarationDateYear: payerDeclarationDate.year,
    },
    checkboxes: {
      Qtfn: Boolean(tfn),
    },
    checkboxExports: {
      title: titleExport,
      residencyStatus: NAT3093_RESIDENCY_EXPORTS[residencyStatus] ?? NAT3093_RESIDENCY_EXPORTS.australian_resident,
      claimTaxFreeThreshold: toYesNoExport(Boolean(taskUpdates.claimTaxFreeThreshold)),
      hasStudyLoanDebt: toYesNoExport(hasStudyLoanDebt),
      hasFinancialSupplementDebt: toYesNoExport(hasFinancialSupplementDebt),
      hasStudyDebt: toYesNoExport(hasStudyDebt),
      medicareExemption: resolveMedicareExemptionExport(taskUpdates.medicareExemption),
    },
  }

  return {
    nat3092: withHash({
      formId: 'nat3092',
      title: 'NAT 3092 TFN declaration',
      documentType: 'tax_setup',
      fileName: `nat3092-${stringify(args.user.id)}.pdf`,
      templateVersion: nat3092Pdf.templateVersion,
      bytes: nat3092Pdf.bytes,
      values: nat3092Values,
    }),
    nat3093: withHash({
      formId: 'nat3093',
      title: 'NAT 3093 withholding declaration',
      documentType: 'tax_setup',
      fileName: `nat3093-${stringify(args.user.id)}.pdf`,
      templateVersion: nat3093Pdf.templateVersion,
      bytes: nat3093Pdf.bytes,
      values: nat3093Values,
    }),
  }
}

function buildNat13080FormValues(args: {
  user: Record<string, unknown>
  taskUpdates: Record<string, unknown>
  settings: OrgSettingsSnapshot
  employeeFullName: string
  declarationDate: { day: string; month: string; year: string }
  useDefault: boolean
  useSmsf: boolean
}) {
  const { user, taskUpdates, settings, employeeFullName, declarationDate, useDefault, useSmsf } = args
  const useExistingFund = !useDefault && !useSmsf
  const superChoice = resolveNat13080SuperChoiceExport({
    useDefaultFund: useDefault,
    useSmsf,
  })

  return {
    text: {
      employeeName: employeeFullName,
      employeeNumber: stringify(user.employeeNumber),
      tfn: resolveTaxTfn(user, taskUpdates),
      existingFundName: useExistingFund
        ? stringify(taskUpdates.superFundName ?? user.superFundName)
        : '',
      existingFundAbn: useExistingFund ? stringify(taskUpdates.superFundAbn) : '',
      existingFundUsi: useExistingFund ? stringify(taskUpdates.superFundId ?? user.superFundId) : '',
      existingMemberNumber: useExistingFund
        ? stringify(taskUpdates.superMemberNumber ?? user.superMemberNumber)
        : '',
      employerAbn: useDefault ? settings.employerAbn : '',
      employerName: useDefault ? settings.employerLegalName : '',
      employerDefaultFundName: useDefault ? settings.defaultSuperFundName : '',
      employerDefaultFundAbn: useDefault ? settings.defaultSuperFundAbn : '',
      employerDefaultFundUsi: useDefault ? settings.defaultSuperFundUsi : '',
      smsfName: useSmsf ? stringify(taskUpdates.smsfName) : '',
      smsfAbn: useSmsf ? stringify(taskUpdates.smsfAbn) : '',
      smsfEsa: useSmsf ? stringify(taskUpdates.smsfEsa) : '',
      smsfBankName: useSmsf ? stringify(taskUpdates.smsfBankName) : '',
      smsfBsb: useSmsf ? stringify(taskUpdates.smsfBsb) : '',
      smsfAccountNumber: useSmsf ? stringify(taskUpdates.smsfAccountNumber) : '',
      declarationYourName: useExistingFund ? employeeFullName : '',
      declarationDateDay: useExistingFund ? declarationDate.day : '',
      declarationDateMonth: useExistingFund ? declarationDate.month : '',
      declarationDateYear: useExistingFund ? declarationDate.year : '',
      employerDeclarationDay: useDefault ? declarationDate.day : '',
      employerDeclarationMonth: useDefault ? declarationDate.month : '',
      employerDeclarationYear: useDefault ? declarationDate.year : '',
      smsfDeclarationName: useSmsf ? employeeFullName : '',
      smsfDeclarationDay: useSmsf ? declarationDate.day : '',
      smsfDeclarationMonth: useSmsf ? declarationDate.month : '',
      smsfDeclarationYear: useSmsf ? declarationDate.year : '',
    },
    checkboxes: {
      Brequired: useExistingFund,
      CDec: useDefault,
      DDec: useSmsf,
    },
    checkboxExports: {
      superChoice,
    },
  }
}

export async function buildSuperDocumentBytes(
  payload: Payload,
  args: {
    user: Record<string, unknown>
    taskUpdates?: Record<string, unknown>
    staffSignature?: StaffSignatureSource | null
    req?: PayloadRequest
  },
): Promise<{ nat13080: BuiltDocumentBytes }> {
  const userId = stringify(args.user.id)
  const settings = await getOrgSettings(payload, args.req)
  const taskUpdates = args.taskUpdates ?? {}
  const firstName = stringify(args.user.firstName)
  const lastName = stringify(args.user.lastName)
  const employeeFullName = `${firstName} ${lastName}`.trim()
  const staffSignature =
    args.staffSignature !== undefined
      ? args.staffSignature
      : await resolveStaffContractSignature(payload, {
          userId: stringify(args.user.id),
          req: args.req,
        })
  const declarationDate = resolvePayeeDeclarationDate(staffSignature)
  const useDefault = Boolean(taskUpdates.superUseDefaultFund ?? args.user.superUseDefaultFund)
  const useSmsf = Boolean(taskUpdates.superUseSmsf)
  const nat13080Values = buildNat13080FormValues({
    user: args.user,
    taskUpdates,
    settings,
    employeeFullName,
    declarationDate,
    useDefault,
    useSmsf,
  })
  const signaturePlacements = resolveNat13080SignatureAnchorFieldNames({
    useDefaultFund: useDefault,
    useSmsf,
  })
  const signaturePlacement = staffSignature
    ? {
        dataUrl: staffSignature.dataUrl,
        placements: signaturePlacements,
      }
    : undefined

  const superPdf = await generateNat13080Pdf({
    ...nat13080Values,
    signature: signaturePlacement,
  })

  return {
    nat13080: withHash({
      formId: 'nat13080',
      title: 'NAT 13080 Superannuation standard choice form',
      documentType: 'super_choice',
      fileName: `nat13080-${userId}.pdf`,
      templateVersion: superPdf.templateVersion,
      bytes: superPdf.bytes,
      values: nat13080Values,
    }),
  }
}

export async function issueBuiltTaxDocuments(
  payload: Payload,
  args: {
    userId: string
    assignmentId?: string | null
    taskId?: string | null
    req?: PayloadRequest
    docs: { nat3092: BuiltDocumentBytes; nat3093: BuiltDocumentBytes }
    issue?: SignedFormIssueMetadata
  },
): Promise<string[]> {
  const issueMeta = args.issue ?? { signed: false }
  const docIds: string[] = []
  for (const doc of [args.docs.nat3092, args.docs.nat3093]) {
    docIds.push(
      await issueOnboardingDocument(payload, {
        userId: args.userId,
        assignmentId: args.assignmentId,
        taskId: args.taskId,
        title: doc.title,
        documentType: doc.documentType,
        fileName: doc.fileName,
        bytes: doc.bytes,
        metadata: formIssueMetadata(doc, issueMeta),
        req: args.req,
      }),
    )
  }
  return docIds
}

export async function issueBuiltSuperDocument(
  payload: Payload,
  args: {
    userId: string
    assignmentId?: string | null
    taskId?: string | null
    req?: PayloadRequest
    doc: BuiltDocumentBytes
    issue?: SignedFormIssueMetadata
  },
): Promise<string> {
  const issueMeta = args.issue ?? { signed: false }
  return issueOnboardingDocument(payload, {
    userId: args.userId,
    assignmentId: args.assignmentId,
    taskId: args.taskId,
    title: args.doc.title,
    documentType: args.doc.documentType,
    fileName: args.doc.fileName,
    bytes: args.doc.bytes,
    metadata: formIssueMetadata(args.doc, issueMeta),
    req: args.req,
  })
}

export async function generateTaxDocuments(
  payload: Payload,
  args: {
    user: Record<string, unknown>
    assignmentId?: string | null
    taskId?: string | null
    taskUpdates?: Record<string, unknown>
    req?: PayloadRequest
  },
): Promise<string[]> {
  const userId = stringify(args.user.id)
  const docs = await buildTaxDocumentBytes(payload, {
    user: args.user,
    taskUpdates: args.taskUpdates,
    req: args.req,
  })
  return issueBuiltTaxDocuments(payload, {
    userId,
    assignmentId: args.assignmentId,
    taskId: args.taskId,
    req: args.req,
    docs,
  })
}

export async function generateSuperDocument(
  payload: Payload,
  args: {
    user: Record<string, unknown>
    assignmentId?: string | null
    taskId?: string | null
    taskUpdates?: Record<string, unknown>
    req?: PayloadRequest
  },
): Promise<string> {
  const userId = stringify(args.user.id)
  const built = await buildSuperDocumentBytes(payload, {
    user: args.user,
    taskUpdates: args.taskUpdates,
    req: args.req,
  })
  return issueBuiltSuperDocument(payload, {
    userId,
    assignmentId: args.assignmentId,
    taskId: args.taskId,
    req: args.req,
    doc: built.nat13080,
  })
}

export async function issueFwoStatements(
  payload: Payload,
  args: {
    user: Record<string, unknown>
    assignmentId?: string | null
    taskId?: string | null
    req?: PayloadRequest
  },
): Promise<string[]> {
  const employmentBasis = stringify(args.user.employmentBasis) || 'casual'
  const statementIds: Array<'fwis' | 'ceis' | 'ftcis'> = ['fwis', 'ceis']
  // Casual-only org baseline: always issue CEIS with FWIS.
  // FTCIS remains conditional and is only issued for fixed-term roles.
  if (employmentBasis === 'fixed_term') statementIds.push('ftcis')

  const docIds: string[] = []
  for (const statementId of statementIds) {
    const copied = await copyOfficialFormBytes(statementId)
    const title =
      statementId === 'fwis'
        ? 'Fair Work Information Statement'
        : statementId === 'ceis'
          ? 'Casual Employment Information Statement'
          : 'Fixed Term Contract Information Statement'
    docIds.push(
      await issueOnboardingDocument(payload, {
        userId: stringify(args.user.id),
        assignmentId: args.assignmentId,
        taskId: args.taskId,
        title,
        documentType: 'fwis_ack',
        fileName: `${statementId}-${String(args.user.id)}.pdf`,
        bytes: copied.bytes,
        metadata: {
          statementId,
          templateVersion: copied.templateVersion,
          issuedAt: new Date().toISOString(),
          ...(statementId === 'ceis'
            ? {
                ceisSchedulerStub:
                  'casual-only-org: schedule CEIS re-issue reminder at 6 and 12 months',
              }
            : {}),
        },
        req: args.req,
      }),
    )
  }
  return docIds
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

export async function reissueSignedOfficialFormsAfterContractSign(
  payload: Payload,
  args: {
    userId: string
    contractSignatureId: string
    req?: PayloadRequest
  },
): Promise<string[]> {
  const staffSignature = await resolveStaffContractSignature(payload, {
    userId: args.userId,
    req: args.req,
  })
  if (!staffSignature) return []

  const existingSigned = await payload.find({
    collection: 'onboarding-documents',
    where: {
      and: [
        { user: { equals: args.userId } },
        { 'metadata.contractSignatureId': { equals: args.contractSignatureId } },
        { 'metadata.generationMode': { equals: 'signed' } },
        { documentType: { in: ['tax_setup', 'super_choice'] } },
      ],
    },
    limit: 1,
    overrideAccess: true,
    req: args.req,
  })
  if (existingSigned.docs[0]) return []

  const user = (await payload.findByID({
    collection: 'staff-users',
    id: args.userId,
    depth: 0,
    overrideAccess: true,
    req: args.req,
  })) as Record<string, unknown>

  const issueMeta: SignedFormIssueMetadata = {
    signed: true,
    contractSignatureId: args.contractSignatureId,
    signedAt: staffSignature.signedAt,
  }
  const issuedIds: string[] = []

  const taxTaskResult = await payload.find({
    collection: 'onboarding-tasks',
    where: {
      and: [
        { user: { equals: args.userId } },
        { type: { equals: 'tax' } },
        { status: { equals: 'complete' } },
      ],
    },
    limit: 1,
    overrideAccess: true,
    req: args.req,
  })
  const taxTask = taxTaskResult.docs[0]
  const taxDeclaration = (user.taxDeclaration as Record<string, unknown> | undefined) ?? {}
  if (taxTask && user.taxSetupStatus === 'employee_confirmed') {
    const built = await buildTaxDocumentBytes(payload, {
      user,
      taskUpdates: taxDeclaration,
      req: args.req,
    })
    const taxDocIds = await issueBuiltTaxDocuments(payload, {
      userId: args.userId,
      assignmentId: relId(taxTask.assignment),
      taskId: String(taxTask.id),
      req: args.req,
      docs: built,
      issue: issueMeta,
    })
    issuedIds.push(...taxDocIds)
  }

  const superTaskResult = await payload.find({
    collection: 'onboarding-tasks',
    where: {
      and: [
        { user: { equals: args.userId } },
        { type: { equals: 'super' } },
        { status: { equals: 'complete' } },
      ],
    },
    limit: 1,
    overrideAccess: true,
    req: args.req,
  })
  const superTask = superTaskResult.docs[0]
  if (superTask && user.superChoiceStatus === 'submitted') {
    const built = await buildSuperDocumentBytes(payload, {
      user,
      taskUpdates: superTaskUpdatesFromUser(user),
      req: args.req,
    })
    const superDocId = await issueBuiltSuperDocument(payload, {
      userId: args.userId,
      assignmentId: relId(superTask.assignment),
      taskId: String(superTask.id),
      req: args.req,
      doc: built.nat13080,
      issue: issueMeta,
    })
    issuedIds.push(superDocId)
  }

  return issuedIds
}

export async function ensureContractDocumentBackfill(
  payload: Payload,
  args: { userId: string; assignmentId?: string | null; req?: PayloadRequest },
): Promise<void> {
  const existingPacket = await payload.find({
    collection: 'onboarding-documents',
    where: {
      and: [
        { user: { equals: args.userId } },
        { documentType: { equals: 'onboarding_packet' } },
      ],
    },
    limit: 1,
    overrideAccess: true,
    req: args.req,
  })
  if (existingPacket.docs[0]) return

  const signatures = await payload.find({
    collection: 'contract-signatures',
    where: { user: { equals: args.userId } },
    sort: '-signedAt',
    limit: 100,
    overrideAccess: true,
    req: args.req,
  })

  for (const signature of signatures.docs as Array<Record<string, unknown>>) {
    const signatureId = stringify(signature.id)
    const signedPdfId = relId(signature.signedPdf)
    if (!signedPdfId) continue
    const existing = await payload.find({
      collection: 'onboarding-documents',
      where: {
        and: [
          { user: { equals: args.userId } },
          { documentType: { equals: 'onboarding_packet' } },
          { 'metadata.signatureId': { equals: signatureId } },
        ],
      },
      limit: 1,
      overrideAccess: true,
      req: args.req,
    })
    if (existing.docs[0]) continue

    await payload.create({
      collection: 'onboarding-documents',
      data: {
        user: relationToNumber(args.userId),
        assignment: relationToNumber(args.assignmentId),
        title: 'Signed onboarding documents (complete packet)',
        documentType: 'onboarding_packet',
        media: relationToNumber(signedPdfId),
        issuedAt: stringify(signature.signedAt) || new Date().toISOString(),
        metadata: {
          signatureId,
          contractId: relId(signature.contract),
          generationMode: 'signed',
          backfilledAt: new Date().toISOString(),
        },
      },
      overrideAccess: true,
      req: args.req,
    })
  }
}

export type VaultPacketSection = {
  id: string
  title: string
  documentType: OnboardingDocumentType
  fileName: string
  bytes: Uint8Array
  contentHash: string
  taskId?: string | null
  metadata?: Record<string, unknown>
}

export async function issueVaultFromPacketSections(
  payload: Payload,
  args: {
    userId: string
    assignmentId?: string | null
    contractSignatureId: string
    packetBytes: Uint8Array
    sections: VaultPacketSection[]
    summarySnapshotHash?: string
    signedAt?: string
    req?: PayloadRequest
  },
): Promise<string[]> {
  const issueMeta: SignedFormIssueMetadata = {
    signed: true,
    contractSignatureId: args.contractSignatureId,
    signedAt: args.signedAt ?? new Date().toISOString(),
  }
  const issuedIds: string[] = []

  const packetId = await issueOnboardingDocument(payload, {
    userId: args.userId,
    assignmentId: args.assignmentId,
    title: 'Signed onboarding documents (complete packet)',
    documentType: 'onboarding_packet',
    fileName: `onboarding-packet-${args.userId}.pdf`,
    bytes: args.packetBytes,
    metadata: {
      generationMode: 'signed',
      contractSignatureId: args.contractSignatureId,
      signedAt: issueMeta.signedAt,
      summarySnapshotHash: args.summarySnapshotHash,
      sectionIds: args.sections.map((section) => section.id),
    },
    req: args.req,
  })
  issuedIds.push(packetId)

  for (const section of args.sections) {
    if (section.id === 'summary') continue
    const docId = await issueOnboardingDocument(payload, {
      userId: args.userId,
      assignmentId: args.assignmentId,
      taskId: section.taskId,
      title: section.title,
      documentType: section.documentType,
      fileName: section.fileName,
      bytes: section.bytes,
      metadata: {
        ...section.metadata,
        formId: section.metadata?.formId ?? section.id,
        generationMode: 'signed',
        contractSignatureId: args.contractSignatureId,
        signedAt: issueMeta.signedAt,
        contentHash: section.contentHash,
      },
      req: args.req,
    })
    issuedIds.push(docId)
  }

  return issuedIds
}

