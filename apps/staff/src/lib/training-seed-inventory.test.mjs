/**
 * Every seeded training slug must have ≥4 contentBlocks (except codesign-practice-capture).
 * Run: node --import tsx src/lib/training-seed-inventory.test.mjs
 */
import assert from 'node:assert/strict'

import { buildCoDesignContentBlocks } from './training-content-seeds.ts'
import {
  CO_DESIGN_TRAINING_SLUGS,
} from './session-capture-fields.ts'
import {
  ensureCoDesignTrainingModules,
  UNIVERSAL_TRAINING_SEEDS,
  assertManifestMatchesSeeds,
} from './training-seeds/upsert.ts'
import { POLICY_SEEDS, section7ContentBlocks, section8ContentBlocks } from './training-content-seeds.ts'
import { TRAINING_MODULE_VERSION_MANIFEST } from './training-module-version-manifest.ts'

assertManifestMatchesSeeds()

const PRACTICE_CAPTURE_SLUG = 'codesign-practice-capture'
const MIN_BLOCKS = 4

function countBlocks(blocks) {
  return Array.isArray(blocks) ? blocks.length : 0
}

const inventory = []

for (const seed of UNIVERSAL_TRAINING_SEEDS) {
  inventory.push({ slug: seed.slug, blocks: countBlocks(seed.contentBlocks) })
}

for (const seed of POLICY_SEEDS) {
  inventory.push({ slug: seed.slug, blocks: countBlocks(seed.contentBlocks) })
}

const coDesignContents = {
  'codesign-golden-rule': "Don't teach.",
  'codesign-before-session': 'Before session.',
  'codesign-welcome-script': 'Welcome.',
  'codesign-during-session': 'During.',
  'codesign-distress-responses': 'Distress.',
  'codesign-section-7': 'Section 7.',
  'codesign-section-8': 'Section 8.',
  'codesign-quotes-notes': 'Quotes.',
  'codesign-privacy-basics': 'Privacy.',
  'codesign-practice-capture': 'Practice.',
}

for (const slug of CO_DESIGN_TRAINING_SLUGS) {
  let blocks
  if (slug === 'codesign-section-7') {
    blocks = section7ContentBlocks()
  } else if (slug === 'codesign-section-8') {
    blocks = section8ContentBlocks()
  } else {
    blocks = buildCoDesignContentBlocks(slug, coDesignContents[slug] ?? '')
  }
  inventory.push({ slug, blocks: countBlocks(blocks) })
}

let failed = false
for (const row of inventory) {
  const minRequired = row.slug === PRACTICE_CAPTURE_SLUG ? 3 : MIN_BLOCKS
  if (row.blocks < minRequired) {
    console.error(`FAIL: ${row.slug} has ${row.blocks} blocks (need ≥${minRequired})`)
    failed = true
  }
}

const manifestSlugs = new Set(Object.keys(TRAINING_MODULE_VERSION_MANIFEST))
for (const row of inventory) {
  if (!manifestSlugs.has(row.slug)) {
    console.error(`FAIL: manifest missing slug ${row.slug}`)
    failed = true
  }
}

assert.equal(typeof ensureCoDesignTrainingModules, 'function')

if (failed) {
  process.exit(1)
}

console.log(`training-seed-inventory: ok (${inventory.length} slugs, all ≥${MIN_BLOCKS} blocks except practice-capture)`)
