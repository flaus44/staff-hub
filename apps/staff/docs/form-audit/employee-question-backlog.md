# Employee Question Backlog

Status reflects implementation in this pass.

## P0 (Implemented)

- [x] Medicare levy exemption type (`none` / `single` / `couple` / `illness`) in `TaxTask`.
  - Form impact: NAT3093 `Q8sub`.
- [x] NAT3093 per-debt mapping split by discovery fields:
  - `Q6`: study loan debt group (`HELP/SSL/TSL/VSL`)
  - `Q7`: SFSS debt
  - `Q8`: aggregate debt indicator
- [x] NAT13080 Section C employer ABN (`C-ABN`) mapped from `org-settings.employerAbn`.

## P1 (Implemented)

- [x] Profile `otherGivenNames` captured and mapped to NAT3092/NAT3093 name fields.
- [x] Profile `addressLine2` captured and mapped to NAT3092 address line 2.
- [x] `employeeNumber` captured in onboarding profile flow and mapped to NAT13080 `A-EmployeeNo`.

## P1/P2 (Data Present, Awaiting Template Support)

- [ ] Payroll contact email on NAT3092.
  - Blocker: no fillable email field discovered on current NAT3092 template.
- [ ] Employer business address + authorized signatory name/title on tax/super forms.
  - Blocker: no matching fillable fields discovered on current templates.
  - Mitigation: values are now stored in OrgSettings for future template versions.

## Recommended Next Additions (After HR/Compliance Review)

- [ ] Explicit handling of NAT3093 `7-amount` if business process needs withholding variation amount capture.
- [ ] Clarify `Qtfn` options handling if ATO process requires precise option selection instead of current boolean fill.
# Employee Question Backlog (Phase 3)

Prioritization:
- `P0`: compliance-critical or current PDF semantic mismatch
- `P1`: improves form completeness/accuracy with moderate urgency
- `P2`: useful enrichment or operational quality improvements

## P0 (Implement first)

| Priority | Question to add/change | Where to ask | Form impact | Why now |
|---|---|---|---|---|
| P0 | Medicare levy exemption type (`none`, `single`, `couple`, `illness`) instead of boolean | `TaxTask` | NAT3093 `Q8sub` | Current UI is boolean while PDF expects enumerated export values |
| P0 | Confirm withholding Q6/Q7 semantics and add matching question(s) if required | `TaxTask` | NAT3093 `Q6`, `Q7` | Discovery shows unmapped required-style yes/no fields |
| P0 | Add/resolve payer declaration completeness rule for NAT3093 | Tax completion flow + backend build | NAT3093 `DecPayer-*` | Payer declaration date fields discovered but currently unmapped |
| P0 | Capture/resolve employee signature-name fields where legally required (`B-yourName`, `D-name`) | `SuperTask` or post-review attestation step | NAT13080 `B-yourName`, `D-name` | Discovered visible fields currently blank and unmapped |

## P1 (Next wave)

| Priority | Question to add/change | Where to ask | Form impact | Why |
|---|---|---|---|---|
| P1 | Other/middle given names (optional) | Profile or `TaxTask` | NAT3092 `2-otherName`, NAT3093 `1-othergivenName` | Currently hardcoded empty |
| P1 | Address line 2 / unit-apartment (optional) | Profile (`TaskCompletionForm` profile mode) | NAT3092 `3-addressLine2` | Currently hardcoded empty |
| P1 | Title selection if legally required for paper parity (`Mr/Ms/Miss/Mrs/Other`) | Profile or `TaxTask` | NAT3092 `2-title`, NAT3093 `1-title`, `1-titleOther` | Discovered title fields currently unmapped |
| P1 | Previous legal name / name change context (if needed by policy) | Profile | NAT3092 `4-nameChange` | Discovered field exists but no capture |

## P2 (Operational/backlog)

| Priority | Question to add/change | Where to ask | Form impact | Why |
|---|---|---|---|---|
| P2 | Employee/payroll number confirmation (or prefill source check) | Invite flow or profile setup | NAT13080 `A-EmployeeNo` | Field is mapped but often blank if not assigned upstream |
| P2 | Existing fund ABN emphasis for own-fund path | `SuperTask` | NAT13080 `B-ABN` | Optional today; completeness improves downstream validation |
| P2 | TFN declaration basis clarification (`lodged`/`pensioner`/`under18`) if required by compliance policy | `TaxTask` | NAT3093 `Qtfn` | Current implementation treats this as simple boolean presence |

## Dependency notes

- Several highest-impact gaps are employer-data backed (`NAT3092 b4-*`, `NAT13080 C-ABN`) and should be implemented alongside the employer worksheet return.
- Employee-question additions must also be wired into:
  - onboarding allowlist/model updates
  - `buildTaxDocumentBytes` / `buildSuperDocumentBytes`
  - preview hash inputs to keep review flow stable

