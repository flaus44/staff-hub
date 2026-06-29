# Training content signoff

**Status: v7 UPLIFT — pending facilitator spot-check (2026-06-29)**

Extends v6 signoff with Training Content v7: WorkSafe dedup, 6 OHS deep dives, section 8 structured blocks, automated seed parity tests.

Operational sign-off for all 22 training and policy modules. Publish gate: average ≥ **8.0/10**, no dimension below **7/10** per module.

| Module slug | Review date | v6 avg | v7 delta | v7 avg | Published |
|-------------|-------------|--------|----------|--------|-----------|
| **Track A — Universal (9)** |
| `whs-induction` | 2026-06-29 | 8.7 | +0.1 | **8.8** | v7 — dedup; hub video links only |
| `whs-remote-work` | 2026-06-29 | 8.6 | +0.1 | **8.7** | v5 — isolation + boundary scenarios |
| `whs-psychosocial-deep-dive` | 2026-06-29 | — | new | **8.5** | v1 — hub links, Incidents mapping |
| `whs-fatigue-and-workload` | 2026-06-29 | — | new | **8.5** | v1 — session-day pacing |
| `whs-aggression-and-violence` | 2026-06-29 | — | new | **8.5** | v1 — de-escalation + report |
| `whs-home-ergonomics` | 2026-06-29 | — | new | **8.4** | v1 — desk setup + injury/property |
| `whs-working-alone` | 2026-06-29 | — | new | **8.5** | v1 — 000 + check-ins |
| `whs-consultation-and-rights` | 2026-06-29 | — | new | **8.5** | v1 — s21/s25 plain language |
| `privacy-basics-staff` | 2026-06-29 | 8.7 | +0.1 | **8.8** | v5 — Singapore + payroll quiz |
| **Track C — Policies** |
| `code-of-conduct` | 2026-06-29 | 8.4 | +0.1 | **8.5** | v4 — 2 scenario MCQs |
| `privacy-data-handling` | 2026-06-29 | 8.5 | +0.1 | **8.6** | v4 — Session Capture walkthrough |
| `incident-reporting-procedure` | 2026-06-29 | 8.8 | +0.0 | **8.8** | v5 — property damage scenario |
| **Track B — Co-design (10 modules)** |
| `codesign-golden-rule` | 2026-06-29 | 8.7 | +0.0 | **8.7** | v4 — step-level scenario |
| `codesign-before-session` | 2026-06-29 | 8.4 | +0.1 | **8.5** | v4 — facilitator example |
| `codesign-welcome-script` | 2026-06-29 | 8.6 | +0.0 | **8.6** | v4 |
| `codesign-during-session` | 2026-06-29 | 8.5 | +0.1 | **8.6** | v4 — Do/Check step |
| `codesign-distress-responses` | 2026-06-29 | 8.9 | +0.0 | **8.9** | v5 |
| `codesign-section-7` | 2026-06-29 | 8.9 | +0.0 | **8.9** | v5 |
| `codesign-section-8` | 2026-06-29 | 8.7 | +0.2 | **8.9** | v4 — section8ContentBlocks |
| `codesign-quotes-notes` | 2026-06-29 | 8.4 | +0.1 | **8.5** | v4 — Do/Check step |
| `codesign-privacy-basics` | 2026-06-29 | 8.6 | +0.0 | **8.6** | v4 |
| `codesign-practice-capture` | 2026-06-29 | 8.8 | +0.0 | **8.8** | v4 |

**Program average (22 modules): 8.6/10** (v6: 8.6 across 16 modules)

---

## v7 platform additions

| Item | Evidence |
|------|----------|
| WorkSafe dedup — no resource card in induction | `WHS_INDUCTION_SEED` v7 |
| `section8ContentBlocks()` | `training-content-seeds.ts` |
| Upsert undefined guard | `training-seeds/upsert.ts` `resolveContentBlocks` |
| 6 OHS modules in gate + provisioning | `training-gate.ts`, `provisioning.ts` |
| Seed inventory test (≥4 blocks) | `training-seed-inventory.test.mjs` |
| Duplicate resource test | `training-duplicate-resources.test.mjs` |
| Version manifest | `training-module-version-manifest.ts` |

---

## Reviewer initials

| Role | Initials | Date | Scope |
|------|----------|------|-------|
| Content lead | DR | 2026-06-29 | v7 uplift — content + acceptance C12–C14 |
| Facilitator spot-check | _pending_ | — | Manual walkthrough checklist in acceptance doc |

---

## Sign-off declaration

v7 content is code-complete and automated tests pass. Facilitator spot-check pending before operational publish.

**Content lead:** Daniel Ross — **2026-06-29**
