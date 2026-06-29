/**
 * No duplicate resourceUrl across seeds; hub video URLs must not appear as resource blocks.
 * Run: node --import tsx src/lib/training-duplicate-resources.test.mjs
 */
import assert from 'node:assert/strict'

import {
  POLICY_SEEDS,
  WHS_INDUCTION_SEED,
  WHS_REMOTE_WORK_SEED,
  WHS_WORKSAFE_VIDEOS,
} from './training-content-seeds.ts'
import { UNIVERSAL_TRAINING_SEEDS } from './training-seeds/upsert.ts'

const hubVideoUrls = new Set(
  WHS_WORKSAFE_VIDEOS.flatMap((tile) => {
    const urls = [tile.videoUrl]
    const watchMatch = tile.videoUrl.match(/embed\/([^?]+)/)
    if (watchMatch) {
      urls.push(`https://www.youtube.com/watch?v=${watchMatch[1]}`)
    }
    return urls
  }),
)

function collectResourceUrls(blocks, slug) {
  const found = []
  if (!Array.isArray(blocks)) return found
  for (const block of blocks) {
    if (block.type === 'resource' && block.resourceUrl) {
      found.push({ slug, url: block.resourceUrl, id: block.id })
    }
  }
  return found
}

const allSeeds = [...UNIVERSAL_TRAINING_SEEDS, ...POLICY_SEEDS]
const resources = allSeeds.flatMap((seed) =>
  collectResourceUrls(seed.contentBlocks, seed.slug),
)

// whs-induction must not have worksafe-guide resource
const inductionResources = resources.filter((r) => r.slug === 'whs-induction')
assert.equal(
  inductionResources.length,
  0,
  'whs-induction must not contain resource blocks (hub videos only)',
)

const urlToSlugs = new Map()
for (const { slug, url, id } of resources) {
  const key = url.trim()
  const entry = urlToSlugs.get(key) ?? []
  entry.push({ slug, id })
  urlToSlugs.set(key, entry)
}

let failed = false
for (const [url, entries] of urlToSlugs) {
  if (entries.length > 1) {
    console.error(
      `FAIL: duplicate resourceUrl ${url} in`,
      entries.map((e) => `${e.slug}#${e.id}`).join(', '),
    )
    failed = true
  }
  for (const hubUrl of hubVideoUrls) {
    if (url.includes(hubUrl) || hubUrl.includes(url)) {
      console.error(`FAIL: hub video URL reused as resource block: ${url} in ${entries[0].slug}`)
      failed = true
    }
  }
}

// Known allowed resources — remote work only owns PDF + WorkWell
const remoteResources = resources.filter((r) => r.slug === 'whs-remote-work')
assert.ok(remoteResources.length >= 2, 'whs-remote-work should retain PDF and WorkWell resources')

if (failed) {
  process.exit(1)
}

console.log(`training-duplicate-resources: ok (${resources.length} resource blocks, no duplicates)`)
