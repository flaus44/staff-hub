import type { PdfFillFieldMap, SignaturePlacement } from '@/lib/pdf-form-fill'

/** Section choice export values on `A-SuperChoice` (page 1). */
export const NAT13080_SUPER_CHOICE_EXPORTS = {
  existingFund: 'Section#20B',
  defaultFund: 'Section#20C',
  smsf: 'Section#20D',
} as const

/**
 * Section B (employee) declaration signature on page 2.
 * Anchor measured from B-Day at x=425.98, y=182.78 in template.
 */
export const NAT13080_SECTION_B_SIGNATURE: SignaturePlacement = {
  mode: 'anchorBox',
  anchorField: 'B-Day',
  box: {
    dx: -398,
    dy: 22,
    width: 150,
    height: 34,
  },
}

/**
 * Section D (SMSF) declaration signature on page 4.
 * Anchor measured from D-Day at x=425.66, y=244.58 in template.
 */
export const NAT13080_SECTION_D_SIGNATURE: SignaturePlacement = {
  mode: 'anchorBox',
  anchorField: 'D-Day',
  box: {
    dx: -397,
    dy: 28,
    width: 150,
    height: 34,
  },
}

export function resolveNat13080SuperChoiceExport(args: {
  useDefaultFund: boolean
  useSmsf: boolean
}): (typeof NAT13080_SUPER_CHOICE_EXPORTS)[keyof typeof NAT13080_SUPER_CHOICE_EXPORTS] {
  if (args.useSmsf) return NAT13080_SUPER_CHOICE_EXPORTS.smsf
  if (args.useDefaultFund) return NAT13080_SUPER_CHOICE_EXPORTS.defaultFund
  return NAT13080_SUPER_CHOICE_EXPORTS.existingFund
}

/** Employee declaration signatures — never use employer Section C date (C-Day). */
export function resolveNat13080SignaturePlacements(args: {
  useDefaultFund: boolean
  useSmsf: boolean
}): SignaturePlacement[] {
  if (args.useSmsf) {
    return [NAT13080_SECTION_B_SIGNATURE, NAT13080_SECTION_D_SIGNATURE]
  }
  return [NAT13080_SECTION_B_SIGNATURE]
}

/** @deprecated Use resolveNat13080SignaturePlacements */
export const resolveNat13080SignatureAnchorFieldNames = resolveNat13080SignaturePlacements

export const NAT13080_FIELD_MAP: PdfFillFieldMap = {
  text: {
    employeeName: 'A-FullName',
    employeeNumber: 'A-EmployeeNo',
    tfn: 'A-TFN',
    existingFundName: 'B-SuperFundName',
    existingFundAbn: 'B-ABN',
    existingFundUsi: 'B-USI',
    existingMemberNumber: 'B-MemberAccNo',
    employerAbn: 'C-ABN',
    employerName: 'C-BusinessName',
    employerDefaultFundName: 'C-SuperFundName',
    employerDefaultFundAbn: 'C-SuperABN',
    employerDefaultFundUsi: 'C-USI',
    smsfName: 'D-SMSFName',
    smsfAbn: 'D-ABN',
    smsfEsa: 'D-SMSFESA',
    smsfBankName: 'D-BankAccountName',
    smsfBsb: 'D-BSB',
    smsfAccountNumber: 'D-accountNumber',
    declarationYourName: 'B-yourName',
    declarationDateDay: 'B-Day',
    declarationDateMonth: 'B-Month',
    declarationDateYear: 'B-Year',
    employerDeclarationDay: 'C-Day',
    employerDeclarationMonth: 'C-Month',
    employerDeclarationYear: 'C-Year',
    smsfDeclarationName: 'D-name',
    smsfDeclarationDay: 'D-Day',
    smsfDeclarationMonth: 'D-Month',
    smsfDeclarationYear: 'D-Year',
  },
  checkboxes: {
    Brequired: 'B-required',
    CDec: 'C-Dec',
    DDec: 'D-Dec',
  },
  checkboxExports: {
    superChoice: 'A-SuperChoice',
  },
}
