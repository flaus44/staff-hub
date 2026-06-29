/**
 * Manifest slug→version must match seed constants.
 * Run: node --import tsx src/lib/training-module-version-manifest.test.mjs
 */
import assert from 'node:assert/strict'

import { assertManifestMatchesSeeds } from './training-seeds/upsert.ts'
import {
  TRAINING_MODULE_MANIFEST_SLUGS,
  TRAINING_MODULE_VERSION_MANIFEST,
} from './training-module-version-manifest.ts'

assertManifestMatchesSeeds()

assert.equal(TRAINING_MODULE_MANIFEST_SLUGS.length, 22, 'v7 inventory is 22 modules')

const expectedV7 = {
  'whs-induction': 7,
  'whs-remote-work': 5,
  'privacy-basics-staff': 5,
  'incident-reporting-procedure': 5,
  'whs-psychosocial-deep-dive': 1,
}

for (const [slug, version] of Object.entries(expectedV7)) {
  assert.equal(TRAINING_MODULE_VERSION_MANIFEST[slug], version, `${slug} version`)
}

console.log('training-module-version-manifest: ok (22 slugs, versions match seeds)')
