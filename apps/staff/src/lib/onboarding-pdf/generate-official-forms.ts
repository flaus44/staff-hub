import {
  NAT13080_FIELD_MAP,
  resolveNat13080SignatureAnchorFieldNames,
} from '@/lib/onboarding-pdf/field-maps/nat13080'
import {
  NAT3092_FIELD_MAP,
  NAT3092_SIGNATURE_PLACEMENT,
} from '@/lib/onboarding-pdf/field-maps/nat3092'
import {
  NAT3093_FIELD_MAP,
  NAT3093_SIGNATURE_PLACEMENT,
} from '@/lib/onboarding-pdf/field-maps/nat3093'
import {
  saveFilledOfficialForm,
  type OfficialFormSignaturePlacement,
  type PdfFillFieldMap,
} from '@/lib/pdf-form-fill'

function pickText(
  map: PdfFillFieldMap,
  values: Record<string, string | null | undefined>,
): Record<string, string | null | undefined> {
  const result: Record<string, string | null | undefined> = {}
  for (const [key, fieldName] of Object.entries(map.text ?? {})) {
    result[fieldName] = values[key]
  }
  return result
}

function pickCheckboxes(
  map: PdfFillFieldMap,
  values: Record<string, boolean | null | undefined>,
): Record<string, boolean | null | undefined> {
  const result: Record<string, boolean | null | undefined> = {}
  for (const [key, fieldName] of Object.entries(map.checkboxes ?? {})) {
    result[fieldName] = values[key]
  }
  return result
}

function pickCheckboxExports(
  map: PdfFillFieldMap,
  values: Record<string, string | null | undefined>,
): Record<string, string | null | undefined> {
  const result: Record<string, string | null | undefined> = {}
  for (const [key, fieldName] of Object.entries(map.checkboxExports ?? {})) {
    result[fieldName] = values[key]
  }
  return result
}

function pickRadios(
  map: PdfFillFieldMap,
  values: Record<string, string | null | undefined>,
): Record<string, string | null | undefined> {
  const result: Record<string, string | null | undefined> = {}
  for (const [key, fieldName] of Object.entries(map.radios ?? {})) {
    result[fieldName] = values[key]
  }
  return result
}

function withDefaultPlacements(
  signature: OfficialFormSignaturePlacement | undefined,
  defaults: OfficialFormSignaturePlacement['placements'],
): OfficialFormSignaturePlacement | undefined {
  if (!signature) return undefined
  return {
    dataUrl: signature.dataUrl,
    placements: signature.placements.length ? signature.placements : defaults,
  }
}

export async function generateNat3092Pdf(values: {
  text: Record<string, string | null | undefined>
  checkboxes: Record<string, boolean | null | undefined>
  checkboxExports?: Record<string, string | null | undefined>
  signature?: OfficialFormSignaturePlacement
}) {
  return saveFilledOfficialForm({
    formId: 'nat3092',
    values: {
      text: pickText(NAT3092_FIELD_MAP, values.text),
      checkboxes: pickCheckboxes(NAT3092_FIELD_MAP, values.checkboxes),
      checkboxExports: pickCheckboxExports(NAT3092_FIELD_MAP, values.checkboxExports ?? {}),
    },
    signature: withDefaultPlacements(values.signature, [NAT3092_SIGNATURE_PLACEMENT]),
  })
}

export async function generateNat3093Pdf(values: {
  text: Record<string, string | null | undefined>
  checkboxes: Record<string, boolean | null | undefined>
  checkboxExports?: Record<string, string | null | undefined>
  radios?: Record<string, string | null | undefined>
  signature?: OfficialFormSignaturePlacement
}) {
  return saveFilledOfficialForm({
    formId: 'nat3093',
    values: {
      text: pickText(NAT3093_FIELD_MAP, values.text),
      checkboxes: pickCheckboxes(NAT3093_FIELD_MAP, values.checkboxes),
      checkboxExports: pickCheckboxExports(NAT3093_FIELD_MAP, values.checkboxExports ?? {}),
      radios: pickRadios(NAT3093_FIELD_MAP, values.radios ?? {}),
    },
    signature: withDefaultPlacements(values.signature, [NAT3093_SIGNATURE_PLACEMENT]),
  })
}

export async function generateNat13080Pdf(values: {
  text: Record<string, string | null | undefined>
  checkboxes: Record<string, boolean | null | undefined>
  checkboxExports?: Record<string, string | null | undefined>
  signature?: OfficialFormSignaturePlacement
}) {
  const useSmsf = Boolean(values.text.smsfDeclarationName)
  const useDefaultFund = Boolean(values.text.employerDeclarationDay && !useSmsf && !values.text.declarationYourName)
  const defaultPlacements = resolveNat13080SignatureAnchorFieldNames({
    useDefaultFund,
    useSmsf,
  })

  return saveFilledOfficialForm({
    formId: 'nat13080',
    values: {
      text: pickText(NAT13080_FIELD_MAP, values.text),
      checkboxes: pickCheckboxes(NAT13080_FIELD_MAP, values.checkboxes),
      checkboxExports: pickCheckboxExports(NAT13080_FIELD_MAP, values.checkboxExports ?? {}),
    },
    signature: withDefaultPlacements(values.signature, defaultPlacements),
  })
}
