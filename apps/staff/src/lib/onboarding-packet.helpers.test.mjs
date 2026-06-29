import assert from 'node:assert/strict'

// Lightweight smoke test for summary snapshot helpers (run: node --import tsx src/lib/onboarding-packet.helpers.test.mjs)

const { hashOnboardingSummarySnapshot, mergeContractFormIntoSummary } = await import(
  './onboarding/onboarding-summary.ts'
)

const sampleSummary = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  sections: [
    {
      id: 'personal',
      title: 'Personal details',
      rows: [{ label: 'Name', value: 'Jane Example' }],
    },
  ],
}

const withContract = mergeContractFormIntoSummary(
  sampleSummary,
  { firstName: 'Jane', startDate: '01/02/2026' },
  { firstName: 'First Name', startDate: 'Start Date' },
)

assert.ok(withContract.sections.some((section) => section.id === 'contract_details'))
assert.equal(
  withContract.sections.find((section) => section.id === 'contract_details')?.rows.length,
  2,
)

const hashA = hashOnboardingSummarySnapshot(withContract)
const hashB = hashOnboardingSummarySnapshot(withContract)
assert.equal(hashA, hashB)
assert.equal(hashA.length, 64)

console.log('onboarding-packet helpers: ok')
