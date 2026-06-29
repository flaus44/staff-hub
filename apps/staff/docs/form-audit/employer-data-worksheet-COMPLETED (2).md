# Employer Data Worksheet (Completed)

Consolidated from the two source worksheets into one form-mapped version.
Scope: NAT3092 Section B, NAT3093 payer section, NAT13080 Section C and declaration context.

Brackets left as `[__________]` still need your input. Notes after a dash explain assumptions or checks.

## Section A — Legal employer identity

- [TEX Education Pty Ltd] Employer legal name (exactly as registered)
- [Financial Literacy Australia] Trading name (if used on forms/payslips; otherwise N/A)
- [87 671 583 387] Employer ABN (11 digits, no separators preferred) — paste from your ABR record / ASIC company statement
- [N/A] Payer branch number (if applicable; otherwise N/A) — only change if the ATO issued you a branch
- [9 Alexander Ave] Registered business address line 1
- [__________] Registered business address line 2 (if any)
- [Horsham] Registered suburb/locality
- [VIC] Registered state/territory
- [3400] Registered postcode — confirm against your registered address

## Section B — Payroll contact details

- [Daniel Ross] Payroll contact full name — change if you delegate payroll
- [03 9968 5884] Payroll contact phone
- [accounts@flaus.com.au] Payroll contact email
- [Managing Director] Payroll role/title (optional but recommended)
- [N/A] Backup payroll contact name (optional)
- [N/A] Backup payroll contact phone/email (optional)

## Section C — Default super fund (NAT13080 Section C)

- [AustralianSuper] Default super fund name
- [STA0100AU] Default super fund USI — verify against AustralianSuper's pre-populated standard choice form
- [65 714 394 898] Default super fund ABN
- [yes] Confirm this default fund should prefill Section C by default (yes/no)
- [N/A] If no, describe alternate rule for default fund selection

Note: from 1 November 2021, stapling applies. For a new hire who does not choose a fund, you generally must request their stapled fund from the ATO before defaulting them into AustralianSuper. The default fund is the fallback, not the automatic first choice — wire this into the onboarding flow, not just the form.

## Section D — Authorisation and declaration settings

- [Daniel Ross] Authorised signatory full name for super declaration context
- [Managing Director] Authorised signatory title/position
- [digital prefill] Employer declaration handling (digital prefill / manual HR completion / hybrid) — auto-prefill employer fields, you review and apply signature before issue
- [auto generation date] Payer declaration date policy (auto generation date vs manual override) — manual override allowed

## Section E — Employee/payroll identifier policy

- [no] Do you assign employee/payroll numbers before onboarding completion? (yes/no) — assign on completion to avoid orphaned numbers
- [ ] Employee number format/pattern — sequential, zero-padded; avoid encoding meaning into the number
- [Xero] Source system of truth (Payroll system name) — name your payroll software, e.g. Xero Payroll, MYOB, Employment Hero
- [Daniel Ross] Who assigns/approves employee number values — until Operations Manager is in place

## Section F — Workforce defaults and statement templates

- [casual] Default employment basis for invites (casual / part_time / full_time / fixed_term) — Phase 1 roles under the Market and Social Research Award 2020
- [No] Are fixed-term hires used? (yes/no) — IGNITE roles are time-limited and grant-funded, which usually points to fixed-term. Confirm with Are-Able before locking.
- [__________] If fixed-term is used, confirm FTCIS template is current and supplied — the Fair Work Fixed Term Contract Information Statement is mandatory for new fixed-term contracts and updates periodically; pin the current version
- [__________] Confirm pinned NAT3092/NAT3093/NAT13080 template versions match compliance requirements — verify against what's in assets/forms

## Notes for implementation handoff

- Orphaned OrgSettings fields: your notes confirm payrollContactEmail, authorizedSignatoryName, authorizedSignatoryTitle and employerBusinessAddress are stored in OrgSettings but have no target field on the current NAT templates. They will collect data that does not place onto the generated forms. Decide whether they are staged for a future template revision or should stop reading as wired prefill.
- Remaining blockers: realistically only the ABN, the registered street address, your payroll phone/email, and the payroll system name are stopping a complete employer prefill. Paste those back and the final OrgSettings values can be locked.
- Stapling logic (Section C note) is a process gap, not a form-field gap — flagged so it is not missed because the form itself looks complete.
