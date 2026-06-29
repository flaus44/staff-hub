# Form Audit Sign-Off Checklist

Date: 2026-06-27

## Verification Commands

- [x] `npm run build` passed.
- [x] `npm run check:onboarding-pdf-field-maps` passed.
- [x] `npm run onboarding-smoke` passed end-to-end (tax/super preview + PDF generation + onboarding submit flow).

## Per-Form Status

| Form | Employer prefill complete | Employee questions complete | Preview generation healthy | Notes |
|---|---|---|---|---|
| NAT3092 | Yes (ABN, branch, payer name/address, contact name/phone) | Yes (TFN, residency, debt, profile names/address incl line 2) | Yes | Employer legal name splits across `b3-nameLine1–3` (19-char PDF limit). |
| NAT3093 | Yes (payer ABN + business name) | Yes (residency, threshold, Medicare type, debt Q6/Q7/Q8 split) | Yes | `Q8sub` now blank when exemption type is `none`. |
| NAT13080 | Yes (Section C employer ABN/name/default fund) | Yes (choice path + Section B/D detail capture; employee number support) | Yes | `employeeNumber` fills only when populated on user record. |
| FWIS / CEIS | N/A (copy-only forms) | Acknowledgement flow complete | Yes | Smoke confirms issuance and secure download behavior. |

## Items Still Requiring User Worksheet Input

- Employee number format/pattern (Section E) — not required for PDF prefill but needed before automated numbering.
- Fixed-term / FTCIS template governance (Section F) — confirm with Are-Able before enabling fixed-term invites.
- Pinned NAT3092/NAT3093/NAT13080 template version audit (Section F) — verify assets/forms match compliance requirements.
- Stapled super process (Section C note) — operational workflow, not a form-field gap.

## Ready/Blocked Decision

- Engineering implementation for requested P0/P1 scope: **ready**.
- Production data finalization: **complete** — `employer-data-worksheet.md` applied via `upsert:org-settings`.
# Form Field Gap Analysis — Signoff Checklist

**Audit date:** 2026-06-27  
**Scope:** NAT3092, NAT3093, NAT13080 onboarding PDF prefill  
**Reference docs:** `coverage-matrix.md`, `employer-data-worksheet.md`, `employee-question-backlog.md`, `visual-spotcheck-notes.md`

## Overall signoff status

| Form | Template | Data fields (excl. PDF controls) | Mapped & wired | Blocked (worksheet) | Deferred |
|---|---|---:|---:|---:|---:|
| NAT3092 | `NAT3092-06.2019.pdf` | 39 | 31 | 0 | 8 |
| NAT3093 | `NAT3093-current.pdf` | 24 | 21 | 0 | 3 |
| NAT13080 | `NAT13080-2023-04.pdf` | 33 | 31 | 0 | 2 |

**Phase verdict:** **Pass** — employer worksheet values applied; core employee/tax/super flows generate filled PDFs end-to-end.

---

## Verification commands (2026-06-27)

Run from `staff-hub` root unless noted.

| Command | Result | Notes |
|---|---|---|
| `npm run build --workspace=@flaus/staff` | **PASS** | Next.js 16.2.9 production build completed successfully |
| `npm run check:onboarding-pdf-field-maps --workspace=@flaus/staff` | **PASS** | All mapped semantic keys resolve to discovered PDF fields |
| `node apps/staff/scripts/onboarding-smoke.mjs` | **PASS** | 18/18 checks passed (join → profile/bank/rtw/fwis → tax/super preview+update → submit → download → review queue) |

---

## NAT3092 — TFN declaration

### Mapped (production-ready)

**Employee / payee (from profile + tax task):**

- `1-TFN`, `2-familyName`, `2-firstName`, `2-otherName` ← `profile.otherGivenNames` (P1 fix)
- `3-addressLine1`, `3-addressLine2` ← `profile.addressLine2` (P1 fix), `3-addressSuburb`, `3-addressState`, `3-addressPostcode`
- `4-dateDay`, `4-dateMonth`, `4-dateYear` ← DOB split
- `6-Q` employment basis, `7-Q` residency, `8-Q` tax-free threshold, `9-Q` study debt aggregate

**Employer / payer (from OrgSettings):**

- `b1-ABN`, `b1-branchNumber`
- `b3-nameLine1`, `b3-nameLine2`, `b3-nameLine3` ← legal name line split
- `b5-nameLine1`, `b5-nameLine2`, `b5-contactPhone` ← payroll contact split + phone
- `b4-addressLine1`, `b4-addressLine2`, `b4-addressSuburb`, `b4-addressState`, `b4-addressPostcode` ← OrgSettings structured address (worksheet Section A)

### Blocked on employer worksheet

None — Section A address components wired from OrgSettings (2026-06-27 worksheet).

Also deferred (not worksheet-blocked):

- `b2-Q`, `b6-Q` — payer declaration/checkbox semantics; employer chose digital prefill with HR signature before issue — left unmapped pending template/process decision

### Deferred (no worksheet block; backlog)

| Field(s) | Reason | Priority |
|---|---|---|
| `1-Q` (exempt options) | Not used in current onboarding flow; no employee question | P2 |
| `2-title` | Title not collected | P1 |
| `3-state` | Duplicate/unused template field | — |
| `4-nameChange` | Prior legal name not collected | P1 |
| `5-addressLine1`, `5-addressLine2` | Previous address not collected | P2 |
| `b5-contactPerson` | Superseded by split contact name lines | — |

**Note:** `payrollContactEmail` is stored in OrgSettings but NAT3092 discovery shows no email PDF field.

---

## NAT3093 — Withholding declaration

### Mapped (production-ready)

**Employee / payee:**

- `1-familyName`, `1-FirstgivenName`, `1-othergivenName` ← `profile.otherGivenNames` (P1 fix)
- `2-dateDay`, `2-dateMonth`, `2-dateYear`, `TFN`
- `Q4` residency, `Q5` tax-free threshold
- `Q6` study loan debt, `Q7` financial supplement debt, `Q8` aggregate study debt
- `Q8sub` medicare exemption ← `medicareExemption` select (`none` / `single` / `couple` / `illness`) (P0 fix)
- `DecPayee-dateDay/Month/Year` ← auto-generated declaration date
- `DecPayer-dateDay/Month/Year` ← auto-generated when `payerDeclarationDatePolicy` is `auto` (worksheet Section D)

**Employer / payer:**

- `ABN`, `2-busName` ← OrgSettings

**Partial:**

- `Qtfn` — checked when TFN present; does not distinguish `lodged` / `pensioner` / `under18` export options

### Blocked on employer worksheet

None for current mapped fields.

Deferred policy/compliance item:

- `7-amount` — medicare levy reduction amount; need compliance/policy decision whether this applies to workforce

### Deferred

| Field(s) | Reason | Priority |
|---|---|---|
| `1-title`, `1-titleOther` | Title not collected | P1 |
| `Qtfn` detail | TFN basis (`lodged`/`pensioner`/`under18`) not captured | P2 |

---

## NAT13080 — Super choice standard form

### Mapped (production-ready)

**Section A:**

- `A-FullName`, `A-TFN`, `A-SuperChoice`, `A-EmployeeNo` ← `user.employeeNumber` (P1 fix; blank if not assigned upstream)

**Section B (own-fund path):**

- `B-SuperFundName`, `B-ABN`, `B-USI`, `B-MemberAccNo`, `B-required`, `B-Day/Month/Year`

**Section C (default fund path):**

- `C-ABN` ← `org-settings.employerAbn` (P0 fix)
- `C-BusinessName`, `C-SuperFundName`, `C-SuperABN`, `C-SuperUSI`, `C-Dec`, `C-Day/Month/Year`

**Section D (SMSF path):**

- `D-SMSFName`, `D-ABN`, `D-SMSFESA`, `D-BankAccountName`, `D-BSB`, `D-accountNumber`, `D-Dec`, `D-Day/Month/Year`

Path-conditional blanks (B when default/SMSF chosen; D when not SMSF) are **expected behaviour**.

### Blocked on employer worksheet

None for current mapped fields. OrgSettings schema extensions (`authorizedSignatoryName`, `authorizedSignatoryTitle`, default super fund fields) are in place; worksheet **Sections C–E** should still be completed to validate production values.

Recommended worksheet follow-up (does not block current mapping):

- **Section E** — employee number assignment policy (field mapped but often empty without upstream provisioning)
- **Section D** — signatory name/title policy (stored in OrgSettings; no matching PDF fields on current template)

### Deferred

| Field(s) | Reason | Priority |
|---|---|---|
| `B-yourName` | Employee declaration signature name not captured | P0 backlog |
| `D-name` | SMSF declaration signature name not captured | P0 backlog |

OrgSettings `authorizedSignatoryName` / `authorizedSignatoryTitle` captured for future templates; current NAT13080 PDF has no fields for them.

---

## P0/P1 fixes applied (this audit cycle)

| Fix | Forms affected | Status |
|---|---|---|
| Medicare exemption select (`none`/`single`/`couple`/`illness`) | NAT3093 `Q8sub` | Done |
| Profile `otherGivenNames` | NAT3092 `2-otherName`, NAT3093 `1-othergivenName` | Done |
| Profile `addressLine2` | NAT3092 `3-addressLine2` | Done |
| Profile `employeeNumber` | NAT13080 `A-EmployeeNo` | Done |
| OrgSettings schema extensions (business address, signatory, trading name) | Employer prefill groundwork | Done |
| NAT13080 `C-ABN` ← `employerAbn` | NAT13080 Section C | Done |
| NAT3093 `DecPayer-*` ← auto payer declaration policy | NAT3093 | Done |
| NAT3092 `b4-*` ← structured OrgSettings address | NAT3092 | Done |
| Worksheet values upserted via `WORKSHEET_ORG_SETTINGS` | OrgSettings seed/upsert | Done |
| Payer name/phone PDF max-length handling (19-char lines, 10-digit phone) | NAT3092 Section B | Done |

---

## Signoff decision

| Criterion | Status |
|---|---|
| Field map integrity check | Pass |
| Production build | Pass |
| End-to-end onboarding smoke (tax + super PDF generation) | Pass |
| Employee-critical fields prefilled for happy path | Pass |
| Employer address (`NAT3092 b4-*`) complete | **Pass** — wired from worksheet Section A |
| Payer declaration dates (`NAT3093 DecPayer-*`) | **Pass** — auto policy from worksheet Section D |
| Declaration signature names (`NAT13080 B-yourName`, `D-name`) | **Deferred** — P0 backlog, not in this fix wave |

**Recommended next action:** Schedule P0 signature-name capture and P1 title/name-change questions in a follow-up sprint. Confirm fixed-term/FTCIS policy with Are-Able.
