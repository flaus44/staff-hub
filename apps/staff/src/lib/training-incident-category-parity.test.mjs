/**
 * Incident category parity — training copy must not list "hazard" as an Incidents form category.
 * Run: node src/lib/training-incident-category-parity.test.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const seedsPath = join(root, 'lib', 'training-content-seeds.ts')
const upsertPath = join(root, 'lib', 'training-seeds', 'upsert.ts')
const sources = [seedsPath, upsertPath].map((path) => readFileSync(path, 'utf8')).join('\n')

const forbiddenPatterns = [
  /injury,\s*near miss,\s*hazard/i,
  /near miss,\s*hazard,\s*or other/i,
  /hazard,\s*or other/i,
  /Choose the type[^.\n]{0,80}hazard/i,
  /type — injury, near miss, hazard/i,
  /category — injury, near miss, hazard/i,
]

let failed = false
for (const pattern of forbiddenPatterns) {
  const match = sources.match(pattern)
  if (match) {
    console.error('FAIL: forbidden incident category copy:', match[0])
    failed = true
  }
}

const learnerFacingFlaus = sources.match(/\bFLAUS\b/g)
if (learnerFacingFlaus?.length) {
  console.error(`FAIL: ${learnerFacingFlaus.length} learner-facing FLAUS reference(s) in training seeds`)
  failed = true
}

if (failed) {
  process.exit(1)
}

console.log('training-incident-category parity: ok')
