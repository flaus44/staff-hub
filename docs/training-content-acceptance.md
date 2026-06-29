# Training content acceptance matrix (v7)

Extends the v6 platform self-test with content-specific checks (C1–C14) for the Training Content v7 wave.

| # | Test | Pass criteria | Method | Status (2026-06-29) |
|---|------|---------------|--------|---------------------|
| C1 | `whs-induction` has ≥5 steps, not one paragraph | Seed has multi-step contentBlocks; UI renders sidebar + player | Manual + seed review | Pass |
| C2 | Each step ≤350 words; Flesch-Kincaid ≤ grade 8 | Spot-check WHS screens; short sentences, no legal paste | Manual | Pass (draft) |
| C3 | Every external link in source register | All URLs in seeds match `docs/training-source-register.md` rows | Doc review | Pass |
| C4 | All modules require stored attestation | `trainingPortal.ts` rejects completion without `attestationAccepted`; stored in `responses` JSON | API code review | Pass |
| C5 | Version bump marks old completion stale | `fetchLearningModulesForUser` excludes stale; list shows "Update available"; gate blocks stale co-design | Code + manual | Pass |
| C6 | Job aids for Track B | Consolidated PDF `GET /job-aids/codesign-facilitator-cheat-sheet.pdf` returns 200; legacy `codesign-*.html` redirect stubs return 200; `/co-design/scripts` embeds PDF at `#cheat-sheet` | HTTP check + manual | Pass |
| C7 | Video blocks have transcript | Hub videos + `TrainingVideoBlock` show transcript accordion; FLA wrapper copy in seed `body` | Schema + UI | Pass |
| C8 | Six-model signoff doc complete for v7 wave | `docs/training-content-signoff.md` — v7 uplift rows initialled | Doc review | Pending facilitator spot-check |
| C9 | Module player uses single-surface shell | Hero + sidebar + player + sticky nav; live region on step change; psychosocial video soft gate | Manual `/training/whs-induction` | Pass |
| C10 | Hub IA — three sections + progress | `/training` shows Recommended path, WorkSafe videos accordion, module cards, overall progress (modules + videos) | Manual | Pass |
| C11 | Honest time estimates + dwell telemetry | List/detail use `estimateModuleReadMinutes`; completion stores optional `dwellMs` in responses | Code + manual | Pass |
| C12 | **WorkSafe dedup** | No `worksafe-guide` resource in `whs-induction`; hub video URLs not repeated as `resource` blocks; PDF/WorkWell only in `whs-remote-work` | `training-duplicate-resources.test.mjs` | Pass |
| C13 | **Seed parity** | Every slug in manifest has ≥4 contentBlocks; manifest versions match seeds | `training-seed-inventory.test.mjs` + `training-module-version-manifest.test.mjs` | Pass |
| C14 | **All modules multi-step** | No legacy single-scroll fallback except `codesign-practice-capture`; `codesign-section-8` has structured blocks | Seed review + manual `/training/codesign-section-8` | Pass |

## Incident category parity (v7 gate)

Training copy must use the five Incidents form categories only: **injury**, **near_miss**, **property**, **psychosocial**, **other**. No **hazard** as a category value.

```bash
cd apps/staff
node src/lib/training-incident-category-parity.test.mjs
```

## How to re-run (v7)

1. Start app and confirm seed upserts: `[seed] Universal training whs-induction: updated` (v7) and six new OHS slugs `created` on first boot.
2. Open `/training` — confirm WHS deep dives modules appear after remote work (sortOrder 3–8).
3. Open `/training/whs-induction` — **no** WorkSafe resource card on any step; hub video deep links only.
4. Open `/training/codesign-section-8` — sidebar shows 5 structured steps (not legacy "Read this").
5. Complete one new OHS module — confirm `moduleVersion` stored in `training-completions`.
6. Run automated tests (below).

## TypeScript check (changed files)

```bash
cd apps/staff
npx tsc --noEmit
node --import tsx src/lib/training-seed-inventory.test.mjs
node --import tsx src/lib/training-duplicate-resources.test.mjs
node --import tsx src/lib/training-module-version-manifest.test.mjs
node src/lib/training-incident-category-parity.test.mjs
node --import tsx src/lib/onboarding-packet.helpers.test.mjs
```

## Manual walkthrough checklist (facilitator spot-check)

- [ ] `/training/whs-induction` — psychosocial step links to hub; no duplicate WorkSafe link card
- [ ] `/training/whs-psychosocial-deep-dive` — ≥4 steps; hub deep links only (no video embed)
- [ ] `/training/codesign-section-8` — verbatim rules + plain-English + examples
- [ ] Stale badge appears after version bump on any completed module
- [ ] Live capture gate blocks until all 22 prerequisite modules complete (excluding practice-capture from gate list but required separately)

## Related docs

- `docs/training-ui-research.md`
- `docs/training-source-register.md`
- `docs/training-content-signoff.md`
- `docs/training-content-audit.md`
- `docs/training-accessibility-standards.md`
