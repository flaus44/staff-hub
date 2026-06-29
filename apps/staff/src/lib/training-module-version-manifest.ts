/**
 * Canonical slug → version map for all training module seeds.
 * Keep in sync with training-content-seeds.ts and training-seeds/upsert.ts.
 */
export const TRAINING_MODULE_VERSION_MANIFEST: Record<string, number> = {
  // Track A — universal WHS and privacy
  'whs-induction': 7,
  'whs-remote-work': 5,
  'whs-psychosocial-deep-dive': 1,
  'whs-fatigue-and-workload': 1,
  'whs-aggression-and-violence': 1,
  'whs-home-ergonomics': 1,
  'whs-working-alone': 1,
  'whs-consultation-and-rights': 1,
  'privacy-basics-staff': 5,
  // Track C — policies
  'code-of-conduct': 4,
  'privacy-data-handling': 4,
  'incident-reporting-procedure': 5,
  // Track B — co-design
  'codesign-golden-rule': 4,
  'codesign-before-session': 4,
  'codesign-welcome-script': 4,
  'codesign-during-session': 4,
  'codesign-distress-responses': 5,
  'codesign-section-7': 5,
  'codesign-section-8': 4,
  'codesign-quotes-notes': 4,
  'codesign-privacy-basics': 4,
  'codesign-practice-capture': 4,
}

export const TRAINING_MODULE_MANIFEST_SLUGS = Object.keys(TRAINING_MODULE_VERSION_MANIFEST)
