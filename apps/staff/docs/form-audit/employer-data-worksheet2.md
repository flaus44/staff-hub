# Employer Data Worksheet (Fill This In)

Use this once, then we can lock final OrgSettings values for onboarding PDF prefill.

## 1) Legal Employer Identity

- [ ] Employer legal name (exactly as registered)
- [ ] Trading name (if different)
- [ ] ABN (11 digits)
- [ ] Payer branch number (or `N/A`)
- [ ] Employer business address (single block)

## 2) Payroll Contact (NAT3092 Section B)

- [ ] Payroll contact full name
- [ ] Payroll contact phone
- [ ] Payroll contact email

## 3) Default Super Fund (NAT13080 Section C)

- [ ] Default fund name
- [ ] Default fund USI
- [ ] Default fund ABN
- [ ] Confirm this default fund is the one new hires should use when they choose employer default (`yes` / `no`)

## 4) Authorized Signatory Metadata

- [ ] Authorized signatory name
- [ ] Authorized signatory title
- [ ] Signature application approach (`digital at generation` / `manual post-review`)

## 5) Workforce/Provisioning Defaults

- [ ] Default employment basis (`full_time` / `part_time` / `casual` / `fixed_term`)
- [ ] Employee number policy (format, owner, and when assigned)

## 6) Template Confirmation

- [ ] Confirm the pinned templates in `assets/forms` are the exact versions submitted operationally.
- [ ] Confirm if FTCIS is required for any fixed-term flows in your operation.

## Current Field-Availability Notes

- `payrollContactEmail` is stored in OrgSettings but no NAT3092 email field exists in the current fillable template.
- `authorizedSignatoryName`, `authorizedSignatoryTitle`, and `employerBusinessAddress` are now stored in OrgSettings; no direct target fields were discovered on current templates, so these are staged for future form revisions.
# Employer Data Worksheet (Phase 3)

Purpose:
- Complete this once as business owner/HR so employer-prefill fields can be wired without guesswork.
- Scope: NAT3092 Section B, NAT3093 payer section, NAT13080 Section C and declaration context.

How to use:
- Fill every item with final values or mark `N/A`.
- Use legal/regulatory values (not shorthand names).
- Keep formatting exact for ABN/branch/phone where applicable.

## Section A — Legal employer identity

- [ ] Employer legal name (exactly as registered)
- [ ] Trading name (if used on forms/payslips; otherwise `N/A`)
- [ ] Employer ABN (11 digits, no separators preferred)
- [ ] Payer branch number (if applicable; otherwise `N/A`)
- [ ] Registered business address line 1
- [ ] Registered business address line 2 (if any)
- [ ] Registered suburb/locality
- [ ] Registered state/territory
- [ ] Registered postcode

## Section B — Payroll contact details

- [ ] Payroll contact full name
- [ ] Payroll contact phone
- [ ] Payroll contact email
- [ ] Payroll role/title (optional but recommended)
- [ ] Backup payroll contact name (optional)
- [ ] Backup payroll contact phone/email (optional)

## Section C — Default super fund (NAT13080 Section C)

- [ ] Default super fund name
- [ ] Default super fund USI
- [ ] Default super fund ABN
- [ ] Confirm this default fund should prefill Section C by default (`yes`/`no`)
- [ ] If `no`, describe alternate rule for default fund selection

## Section D — Authorisation and declaration settings

- [ ] Authorised signatory full name for super declaration context
- [ ] Authorised signatory title/position
- [ ] Employer declaration handling (`digital prefill`, `manual HR completion`, or `hybrid`)
- [ ] Payer declaration date policy (`auto generation date` vs manual override requirement)

## Section E — Employee/payroll identifier policy

- [ ] Do you assign employee/payroll numbers before onboarding completion? (`yes`/`no`)
- [ ] Employee number format/pattern (example: `EMP-000123`)
- [ ] Source system of truth (Payroll system name)
- [ ] Who assigns/approves employee number values

## Section F — Workforce defaults and statement templates

- [ ] Default employment basis for invites (`casual`, `part_time`, `full_time`, `fixed_term`)
- [ ] Are fixed-term hires used? (`yes`/`no`)
- [ ] If fixed-term is used, confirm FTCIS template is current and supplied
- [ ] Confirm pinned NAT3092/NAT3093/NAT13080 template versions match compliance requirements

## Notes for implementation handoff

- Any blank or uncertain item above will block complete employer prefill.
- Especially critical for current matrix gaps:
  - Employer address fields used in NAT3092 payer section (`b4-*`)
  - Employer ABN placement in NAT13080 Section C (`C-ABN`)
  - Super declaration signatory policy/details

