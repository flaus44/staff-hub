import { NAT13080_FIELD_MAP } from '@/lib/onboarding-pdf/field-maps/nat13080'
import { NAT3092_FIELD_MAP } from '@/lib/onboarding-pdf/field-maps/nat3092'
import { NAT3093_FIELD_MAP } from '@/lib/onboarding-pdf/field-maps/nat3093'
import { assertFieldMapMatchesTemplate, type PdfFillFieldMap } from '@/lib/pdf-form-fill'

async function check(formId: 'nat3092' | 'nat3093' | 'nat13080', map: PdfFillFieldMap) {
  const result = await assertFieldMapMatchesTemplate(formId, map)
  if (result.skipped) {
    throw new Error(`[skip] ${formId}: ${result.reason}`)
  }
  console.log(`[ok] ${formId} field map matches template`)
}

async function run() {
  await check('nat3092', NAT3092_FIELD_MAP)
  await check('nat3093', NAT3093_FIELD_MAP)
  await check('nat13080', NAT13080_FIELD_MAP)
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
