import type { PdfFillFieldMap, SignaturePlacement } from '@/lib/pdf-form-fill'

/**
 * Payee declaration signature box left of DecPayee-date* row on NAT3093-current.pdf page 6 (index 5).
 * Anchor: DecPayee-dateDay at x≈425, y≈416.7 — box measured to printed signature area.
 */
export const NAT3093_SIGNATURE_PLACEMENT: SignaturePlacement = {
  mode: 'anchorBox',
  anchorField: 'DecPayee-dateDay',
  box: {
    dx: -397,
    dy: -8,
    width: 150,
    height: 32,
  },
}

export const NAT3093_FIELD_MAP: PdfFillFieldMap = {
  text: {
    surname: '1-familyName',
    givenNames: '1-FirstgivenName',
    otherGivenNames: '1-othergivenName',
    dateOfBirthDay: '2-dateDay',
    dateOfBirthMonth: '2-dateMonth',
    dateOfBirthYear: '2-dateYear',
    tfn: 'TFN',
    payerAbn: 'ABN',
    payerName: '2-busName',
    declarationDateDay: 'DecPayee-dateDay',
    declarationDateMonth: 'DecPayee-dateMonth',
    declarationDateYear: 'DecPayee-dateYear',
    payerDeclarationDateDay: 'DecPayer-dateDay',
    payerDeclarationDateMonth: 'DecPayer-dateMonth',
    payerDeclarationDateYear: 'DecPayer-dateYear',
  },
  checkboxExports: {
    title: '1-title',
    residencyStatus: 'Q4',
    claimTaxFreeThreshold: 'Q5',
    hasStudyLoanDebt: 'Q6',
    hasFinancialSupplementDebt: 'Q7',
    hasStudyDebt: 'Q8',
    medicareExemption: 'Q8sub',
  },
}
