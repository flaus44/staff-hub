# Visual Spot-Check Notes — Signature Placement

Date: 2026-06-27

## Method

- Regenerated field inventory (with widget rects) via `npx tsx scripts/discover-pdf-fields.ts`.
- Generated signature placement previews via `node scripts/verify-signature-placement.mjs` → `tmp/signature-spotcheck/`.
- Replaced heuristic anchor math with calibrated `absoluteRect` / `anchorBox` placements and PNG trim-before-scale.

## Signature placement fixes

| Form | Placement | Expected visual |
|------|-----------|-----------------|
| NAT3092 | `absoluteRect` page index 4 (x=307, y=186, 142×34) | Signature inside payee declaration “Signature of payee” box — not at Section 2 name |
| NAT3093 | `anchorBox` on `DecPayee-dateDay` (dx=-397, dy=-8, 150×32) | Signature left of payee declaration date row |
| NAT13080 | `anchorBox` on `B-Day` (all paths); plus `D-Day` for SMSF | Employee declaration signature left of date — never employer `C-Day` |

## Manual sign-off checklist

Open **Signed — Employment Agreement** after re-signing (draw + type-to-sign modes):

- [ ] NAT3092 page 5: signature readable, inside declaration box
- [ ] NAT3093: signature left of date, not on border
- [ ] NAT13080: signature on employee declaration (default fund uses Section B, not Section C employer date)
- [ ] Contract PDF: signature centered in signature area
- [ ] FWIS/CEIS ack pages: signature in acknowledgement footer box

Preview PDFs with red guide rectangles: `apps/staff/tmp/signature-spotcheck/`.

---

# Visual Spot-Check Notes (Field mapping — prior)

## Method

- Regenerated field inventory via `npx tsx scripts/discover-pdf-fields.ts`.
- Cross-checked mapped fields against current field maps and `buildTaxDocumentBytes` / `buildSuperDocumentBytes`.
- Used onboarding smoke flow to ensure preview-and-submit path still generates filled PDFs for NAT3092, NAT3093, NAT13080.

## NAT3092

- Employee identity and address fields are now populated from profile, including `otherGivenNames` and `addressLine2`.
- Section B payer core fields are populated (`ABN`, payer name lines, branch, contact name, contact phone).
- No fillable payer email field exists on template, so `payrollContactEmail` cannot be rendered.
- Several template-only controls/legacy fields remain intentionally unmapped (`1-Q`, `b2-Q`, `b6-Q`, `Print/Save/Reset`).

## NAT3093

- Medicare exemption now supports explicit type selection (`none`, `single`, `couple`, `illness`).
- `none` now leaves `Q8sub` unselected; non-none values map to template exports.
- Debt questions are now mapped per discovery:
  - `Q6`: study loan debt group (`HELP/SSL/TSL/VSL`)
  - `Q7`: SFSS debt
  - `Q8`: aggregate debt flag
- Payer declaration date fields remain intentionally blank (employee-facing flow only).

## NAT13080

- Section C employer ABN now maps to `C-ABN` from `org-settings.employerAbn`.
- Section C business/default fund fields are wired from OrgSettings and populate in preview generation path.
- `A-EmployeeNo` is mapped but depends on whether `staff-users.employeeNumber` is set.
- No explicit template fields were discovered for authorized signatory name/title or employer business address text.

## Outstanding Manual Sign-Off

- HR should visually compare generated PDFs against current official paper forms before production rollout.
- Priority check areas:
  - NAT3093 Q6/Q7/Q8 semantics and wording alignment.
  - NAT13080 Section C wording for employer declaration context (especially ABN vs fund ABN).
# Visual Spot-Check Notes (Phase 2)

Method:
- Compared `buildTaxDocumentBytes` and `buildSuperDocumentBytes` payload assembly with each PDF field map and discovered field inventory.
- Flagged fields that are likely visible on official layouts but remain blank/unmapped in generated previews.
- Focused on NAT3092, NAT3093, NAT13080 preview outputs from onboarding task flows.

## NAT3092 (TFN declaration)

Likely empty visible fields in preview:
- `2-otherName`: explicitly set to empty string in `buildTaxDocumentBytes`.
- `3-addressLine2`: explicitly set to empty string in `buildTaxDocumentBytes`.
- `b4-addressLine1`, `b4-addressLine2`, `b4-addressSuburb`, `b4-addressState`, `b4-addressPostcode`, `b4-state`: discovered fields exist but no mapping/source.
- `b2-Q`, `b6-Q`: discovered checkbox fields not mapped.
- `b5-contactPerson`: discovered field not mapped (current implementation uses split contact name lines only).
- `4-nameChange`: discovered text field not mapped.

Additional mismatch risk:
- `2-title` and `1-Q` options exist but no upstream employee question wiring.
- Employer contact email exists in `OrgSettings` (`payrollContactEmail`) but no corresponding mapped PDF field on current map; verify if template expects an email field elsewhere.

## NAT3093 (Withholding declaration)

Likely empty visible fields in preview:
- `1-othergivenName`: explicitly set to empty string in `buildTaxDocumentBytes`.
- `DecPayer-dateDay`, `DecPayer-dateMonth`, `DecPayer-dateYear`: discovered date fields, currently unmapped.
- `1-title`, `1-titleOther`: discovered title-related fields, currently unmapped.
- `7-amount`: discovered text field, currently unmapped.
- `Q6`, `Q7`: discovered yes/no fields, currently unmapped.

Known semantic mismatch:
- `Q8sub` supports `Single`, `couple`, `illness`, but `TaxTask` currently captures `medicareExemption` as boolean.
- `Q8` is mapped from aggregated `hasStudyDebt` (OR across debt toggles); if official flow expects distinct Q6/Q7 semantics, preview may not reflect all required answers.
- `Qtfn` has multiple export options (`lodged`, `pensioner`, `under18`) but is currently set as simple boolean checkbox.

## NAT13080 (Super choice)

Likely empty visible fields in preview:
- `C-ABN`: discovered text field currently unmapped.
- `B-yourName`: discovered text field currently unmapped.
- `D-name`: discovered text field currently unmapped.

Conditionally empty (expected by path, but visible when section shown):
- Own-fund section (`B-*`) fields are intentionally blank when `superUseDefaultFund` or SMSF path is chosen.
- SMSF section (`D-*`) fields are intentionally blank unless SMSF path is chosen.
- `A-EmployeeNo` may be blank when `user.employeeNumber` is not assigned upstream.

Ambiguity to verify against paper layout:
- `C-SuperABN` is populated from `defaultSuperFundAbn`. Field name suggests super fund ABN, but confirm whether any Section C field should instead carry employer ABN (especially since `C-ABN` is currently unmapped).
- `C-Dec` / `D-Dec` use checkbox exports with option `no`; verify visual checked state renders as intended on target PDF readers.

## Cross-form observations

- Field map integrity check passes (`check-onboarding-form-field-maps.ts`) for existing mapped keys, but this only validates that mapped fields exist; it does not detect discovered-but-unmapped fields.
- Main visible blanks are concentrated in:
  - Optional identity/address fields not currently asked (`other names`, `address line 2`, `titles`)
  - Employer Section B/C address or ABN fields not yet sourced from `OrgSettings`
  - Additional withholding semantic fields in NAT3093 (`Q6`, `Q7`, payer declaration date)

## Signature Placement Spot-Check

- Generated visual fixtures with `node scripts/verify-signature-placement.mjs`.
- Outputs are written to `tmp/signature-spotcheck/`:
  - `nat3092-signature.pdf`
  - `nat3093-signature.pdf`
  - `nat13080-existing-signature.pdf`
  - `nat13080-default-signature.pdf`
  - `nat13080-smsf-signature.pdf`
- Coordinate references used:
  - NAT3092 payee declaration line (no AcroForm): page 5 (index 4), line x=`305.27..584.44`, y=`208.27`.
  - NAT3093 anchor `DecPayee-dateDay`: x=`425.07`, y=`416.67`, w=`28.66`, h=`17.01`.
  - NAT13080 anchors:
    - `B-Day`: x=`425.98`, y=`182.78`, w=`28.66`, h=`17.01`.
    - `D-Day`: x=`425.66`, y=`244.58`, w=`28.66`, h=`17.01`.
- Manual visual checks still required in generated onboarding packets for both draw and type-to-sign capture modes.

