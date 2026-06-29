# Training content inventory (v7 audit)

Audit date: **2026-06-29**. Word counts are approximate from seed content + contentBlocks.

**Sign-off status:** v7 wave ready for facilitator spot-check — see [`training-content-signoff.md`](training-content-signoff.md).

| # | Slug | Track | Title | Words (est.) | Quiz? | Attestation? | Source register ID | contentBlocks | Version |
|---|------|-------|-------|--------------|-------|--------------|-------------------|---------------|---------|
| 1 | `whs-induction` | A | Workplace health and safety induction | 900 | Yes (3 MCQ + attestations) | Yes | WS-VIC-OFFICE, WS-VIC-OHS-ACT, INTERNAL-INCIDENT | 15 steps | 7 |
| 2 | `whs-remote-work` | A | Working safely from home | 750 | Yes (3 scenarios) | Yes | WS-VIC-WFH, WS-VIC-REMOTE | 9 steps | 5 |
| 3 | `whs-psychosocial-deep-dive` | A | Psychosocial hazards at work | 550 | Yes (1 scenario) | Yes | WS-VIC-BULLYING, hub videos | 6 steps | 1 |
| 4 | `whs-fatigue-and-workload` | A | Fatigue and workload | 450 | Yes (1 scenario) | Yes | WS-VIC-FATIGUE | 5 steps | 1 |
| 5 | `whs-aggression-and-violence` | A | Aggression and violence | 450 | Yes (1 scenario) | Yes | WS-VIC-AGGRESSION, WS-VIC-VIOLENCE-RISK | 5 steps | 1 |
| 6 | `whs-home-ergonomics` | A | Home office ergonomics | 450 | No | Yes | WS-QLD-HOME-OFFICE | 5 steps | 1 |
| 7 | `whs-working-alone` | A | Working alone and emergencies | 400 | Yes (1 scenario) | Yes | WS-VIC-REMOTE, INTERNAL-INCIDENT | 5 steps | 1 |
| 8 | `whs-consultation-and-rights` | A | Consultation and your rights | 450 | Yes (1 scenario) | Yes | WS-VIC-OHS-ACT | 5 steps | 1 |
| 9 | `privacy-basics-staff` | A | Your privacy and where data is stored | 600 | Yes (2 MCQ) | Yes | OAIC-APP, INTERNAL-PRIVACY | 6 steps | 5 |
| 10 | `code-of-conduct` | C | Code of conduct | 800 | Yes (2 scenarios) | Yes | INTERNAL-PRIVACY | 6 steps | 4 |
| 11 | `privacy-data-handling` | C | Privacy and data handling | 900 | Yes (2 scenarios) | Yes | INTERNAL-PRIVACY | 7 steps | 4 |
| 12 | `incident-reporting-procedure` | C | Incident reporting procedure | 750 | Yes (3 scenarios) | Yes | INTERNAL-INCIDENT | 9 steps | 5 |
| 13 | `codesign-golden-rule` | B | Golden rule — don't teach | 450 | Yes (module + step) | Yes | INTERNAL | 4 steps | 4 |
| 14 | `codesign-before-session` | B | Before the session | 400 | No | Yes | INTERNAL | 4 steps | 4 |
| 15 | `codesign-welcome-script` | B | Welcome script | 350 | No | Yes | INTERNAL | 4 steps | 4 |
| 16 | `codesign-during-session` | B | During the session | 400 | No | Yes | INTERNAL | 4 steps | 4 |
| 17 | `codesign-distress-responses` | B | Distress responses | 550 | Yes (2 Q) | Yes | INTERNAL | 6 steps | 5 |
| 18 | `codesign-section-7` | B | Section 7 — say every word | 550 | Yes (2 Q) | Yes | INTERNAL-S7 | 4 steps | 5 |
| 19 | `codesign-section-8` | B | Section 8 — contact details rules | 500 | Yes (2 Q) | Yes | INTERNAL-PRIVACY | 5 steps | 4 |
| 20 | `codesign-quotes-notes` | B | Quotes and notes | 400 | No | Yes | INTERNAL-PRIVACY | 4 steps | 4 |
| 21 | `codesign-privacy-basics` | B | What not to put in the form | 500 | No | Yes | INTERNAL-PRIVACY | 4 steps | 4 |
| 22 | `codesign-practice-capture` | B | Practice session capture | 250 | No | Yes | INTERNAL | 3 steps | 4 |

**Total modules:** 22 (9 Track A universal + 3 Track C policies + 10 Track B co-design)

## Gaps closed in v7

- **WorkSafe dedup** — removed `worksafe-guide` resource from `whs-induction`; hub videos are the single WorkSafe video surface
- **`codesign-section-8`** — structured `section8ContentBlocks()` (was `undefined` → legacy fallback)
- **Upsert guard** — never passes `undefined` contentBlocks; logs warning + single fallback block
- **6 OHS deep dives** — psychosocial, fatigue, aggression, ergonomics, working alone, consultation
- **Automated inventory** — `training-seed-inventory.test.mjs`, `training-duplicate-resources.test.mjs`, `training-module-version-manifest.ts`
- **All modules multi-step** — ≥4 contentBlocks per slug (except `codesign-practice-capture`)

## Verification

```bash
cd apps/staff
node --import tsx src/lib/training-seed-inventory.test.mjs
node --import tsx src/lib/training-duplicate-resources.test.mjs
node --import tsx src/lib/training-module-version-manifest.test.mjs
node src/lib/training-incident-category-parity.test.mjs
```
