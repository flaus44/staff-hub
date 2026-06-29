import type { PdfFillFieldMap, SignaturePlacement } from '@/lib/pdf-form-fill'

/**
 * NAT3092 payee declaration has no AcroForm signature widget.
 * Measured from `assets/forms/NAT3092-06.2019.pdf` page 5 (index 4):
 * declaration line x=305.27..584.44 at y=208.27 (pdf-lib coordinates).
 */
export const NAT3092_SIGNATURE_PLACEMENT: SignaturePlacement = {
  mode: 'absoluteRect',
  pageIndex: 4,
  x: 307,
  y: 186,
  width: 142,
  height: 34,
}

export const NAT3092_FIELD_MAP: PdfFillFieldMap = {
  text: {
    payeeSurname: '2-familyName',
    payeeGivenNames: '2-firstName',
    payeeOtherGivenNames: '2-otherName',
    dateOfBirthDay: '4-dateDay',
    dateOfBirthMonth: '4-dateMonth',
    dateOfBirthYear: '4-dateYear',
    addressLine1: '3-addressLine1',
    addressLine2: '3-addressLine2',
    payeeEmailLine1: '5-addressLine1',
    payeeEmailLine2: '5-addressLine2',
    suburb: '3-addressSuburb',
    state: '3-addressState',
    postcode: '3-addressPostcode',
    tfn: '1-TFN',
    payerNameLine1: 'b3-nameLine1',
    payerNameLine2: 'b3-nameLine2',
    payerNameLine3: 'b3-nameLine3',
    payerAbn: 'b1-ABN',
    payerBranch: 'b1-branchNumber',
    payerEmailLine1: 'b5-nameLine1',
    payerEmailLine2: 'b5-nameLine2',
    payerContactName: 'b5-contactPerson',
    payerContactPhone: 'b5-contactPhone',
    payerAddressLine1: 'b4-addressLine1',
    payerAddressLine2: 'b4-addressLine2',
    payerAddressSuburb: 'b4-addressSuburb',
    payerAddressState: 'b4-addressState',
    payerAddressPostcode: 'b4-addressPostcode',
  },
  checkboxExports: {
    title: '2-title',
    employmentBasis: '6-Q',
    residencyStatus: '7-Q',
    claimTaxFreeThreshold: '8-Q',
    hasStudyDebt: '9-Q',
  },
}
