# Training content audit — v5 baseline

**Date:** 2026-06-27  
**Scope:** 19 modules across Tracks A, B, C

## Summary

| Track | Modules | Prior state | v5 action |
|-------|---------|-------------|-----------|
| A — Universal | 3 | One-sentence stubs (`whs-induction` priority) | 5-step `contentBlocks`, summaries, version 2 |
| B — Co-design | 10 | Thin bullet lists; 4 gated with 1 quiz Q each | Expanded blocks; 2nd quiz Q on gated modules; job aids |
| C — Policies | 3 | Generic boilerplate; create-if-missing seed bug | FLAUS-specific text; upsert-by-slug; version 2 |

## Module inventory

| Slug | Words (approx, pre-v5) | Quiz | Attestation | Source register |
|------|------------------------|------|-------------|-----------------|
| whs-induction | ~20 | — | — | WS-VIC-OFFICE |
| whs-remote-work | ~25 | — | — | WS-VIC-WFH, WS-VIC-REMOTE |
| privacy-basics-staff | ~30 | — | — | OAIC-APP |
| codesign-golden-rule | ~25 | 1 Q | yes | INTERNAL |
| codesign-before-session | ~20 | — | — | INTERNAL |
| codesign-welcome-script | ~25 | — | — | INTERNAL |
| codesign-during-session | ~20 | — | — | INTERNAL |
| codesign-distress-responses | ~40 | 1 Q | yes | INTERNAL |
| codesign-section-7 | ~100 | 1 Q | yes | INTERNAL-S7 |
| codesign-section-8 | ~35 | 1 Q | yes | INTERNAL |
| codesign-quotes-notes | ~25 | — | — | INTERNAL |
| codesign-privacy-basics | ~45 | — | — | INTERNAL |
| codesign-practice-capture | ~30 | — | — | INTERNAL |
| code-of-conduct | ~30 | — | — | FLAUS-authored |
| privacy-data-handling | ~30 | — | — | data-handling-and-privacy.md |
| incident-reporting-procedure | ~30 | — | — | FLAUS-authored |

## Seed fix

`ensureLearningModules` previously used create-if-missing for `whs-induction` and all policy modules, leaving stale one-line content in existing databases. v5 converts to upsert-by-slug (matching `ensureCoDesignTrainingModules`).
