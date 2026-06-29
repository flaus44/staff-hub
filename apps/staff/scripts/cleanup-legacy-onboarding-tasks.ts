/**
 * One-off cleanup for legacy onboarding task rows (tax, manual, rtw).
 *
 * These types are hidden from the portal UI but may still exist in the database
 * from older onboarding packs. This script marks them complete (default) or
 * deletes them when --delete is passed.
 *
 * Run from staff-hub root:
 *   npm run cleanup-legacy-onboarding-tasks --workspace=@flaus/staff
 *
 * Or from apps/staff:
 *   npm run cleanup-legacy-onboarding-tasks
 *
 * Options:
 *   --delete   Permanently delete matching rows instead of marking complete
 *   --dry-run  Log actions without writing changes
 */
import { getPayload } from 'payload'

import config from '@payload-config'

const LEGACY_TYPES = ['tax', 'manual', 'rtw'] as const

const args = process.argv.slice(2)
const shouldDelete = args.includes('--delete')
const dryRun = args.includes('--dry-run')

const payload = await getPayload({ config })

let page = 1
let processed = 0
let changed = 0
let skipped = 0

while (true) {
  const result = await payload.find({
    collection: 'onboarding-tasks',
    where: {
      type: { in: [...LEGACY_TYPES] },
    },
    limit: 100,
    page,
  })

  if (result.docs.length === 0) break

  for (const doc of result.docs) {
    processed += 1
    const id = String(doc.id)
    const type = String((doc as { type?: string }).type ?? '')
    const status = String((doc as { status?: string }).status ?? '')

    if (shouldDelete) {
      if (dryRun) {
        console.log(`[dry-run] would delete task ${id} (${type})`)
        changed += 1
        continue
      }

      await payload.delete({
        collection: 'onboarding-tasks',
        id,
      })
      console.log(`Deleted task ${id} (${type})`)
      changed += 1
      continue
    }

    if (status === 'complete') {
      skipped += 1
      continue
    }

    if (dryRun) {
      console.log(`[dry-run] would mark complete task ${id} (${type}, was ${status})`)
      changed += 1
      continue
    }

    await payload.update({
      collection: 'onboarding-tasks',
      id,
      data: { status: 'complete' },
    })
    console.log(`Marked complete task ${id} (${type}, was ${status})`)
    changed += 1
  }

  if (!result.hasNextPage) break
  page += 1
}

console.log(
  `Done. processed=${processed} changed=${changed} skipped=${skipped} mode=${
    shouldDelete ? 'delete' : 'complete'
  }${dryRun ? ' (dry-run)' : ''}`,
)

process.exit(0)
