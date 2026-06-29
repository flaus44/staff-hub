# Form Coverage Matrix

Source: `docs/form-audit/discover-output.txt` regenerated via `npx tsx scripts/discover-pdf-fields.ts`.

## NAT3092 (`NAT3092-06.2019.pdf`)

| PDF field name | Field type | Options (if any) | Semantic key (field map) | Current data source | Status |
|---|---|---|---|---|---|
| `1-Q` | checkbox export | `exempt1`, `exempt2`, `separate` | - | not used in current flow | unmapped |
| `1-TFN` | text | - | `tfn` | `taxTask.tfn` (or decrypted `staff-users.tfnEncrypted`) | filled |
| `2-familyName` | text | - | `payeeSurname` | `staff-users.lastName` | filled |
| `2-firstName` | text | - | `payeeGivenNames` | `staff-users.firstName` | filled |
| `2-otherName` | text | - | `payeeOtherGivenNames` | `staff-users.profile.otherGivenNames` | filled |
| `2-title` | checkbox export | `Miss`, `Mr`, `Mrs`, `Ms` | - | title not collected | unmapped |
| `3-addressLine1` | text | - | `addressLine1` | `staff-users.profile.addressLine1` | filled |
| `3-addressLine2` | text | - | `addressLine2` | `staff-users.profile.addressLine2` | filled |
| `3-addressPostcode` | text | - | `postcode` | `staff-users.profile.postcode` | filled |
| `3-addressState` | text | - | `state` | `staff-users.profile.state` | filled |
| `3-addressSuburb` | text | - | `suburb` | `staff-users.profile.suburb` | filled |
| `3-state` | text | - | - | duplicate/unused state field | unmapped |
| `4-dateDay` | text | - | `dateOfBirthDay` | `staff-users.profile.dateOfBirth` (day split) | filled |
| `4-dateMonth` | text | - | `dateOfBirthMonth` | `staff-users.profile.dateOfBirth` (month split) | filled |
| `4-dateYear` | text | - | `dateOfBirthYear` | `staff-users.profile.dateOfBirth` (year split) | filled |
| `4-nameChange` | text | - | - | no source collected | unmapped |
| `5-addressLine1` | text | - | - | prior address not collected | unmapped |
| `5-addressLine2` | text | - | - | prior address not collected | unmapped |
| `6-Q` | checkbox export | `casual`, `full-time`, `labour`, `part-time`, `super` | `employmentBasis` | `staff-users.employmentBasis` | filled |
| `7-Q` | checkbox export | `Aust#20resident`, `foreign#20resident`, `working#20holiday#20maker` | `residencyStatus` | `taxTask.residencyStatus` | filled |
| `8-Q` | checkbox export | `no`, `yes` | `claimTaxFreeThreshold` | `taxTask.claimTaxFreeThreshold` | filled |
| `9-Q` | checkbox export | `no`, `yes` | `hasStudyDebt` | aggregate of debt flags in `taxTask` | filled |
| `b1-ABN` | text | - | `payerAbn` | `org-settings.employerAbn` | employer-orgsettings |
| `b1-branchNumber` | text | - | `payerBranch` | `org-settings.payerBranchNumber` | employer-orgsettings |
| `b2-Q` | checkbox export | `no`, `yes` | - | not used in mapping | unmapped |
| `b3-nameLine1` | text | - | `payerNameLine1` | `org-settings.employerLegalName` (split line 1) | employer-orgsettings |
| `b3-nameLine2` | text | - | `payerNameLine2` | `org-settings.employerLegalName` (split line 2) | employer-orgsettings |
| `b3-nameLine3` | text | - | `payerNameLine3` | `org-settings.employerLegalName` (split line 3) | employer-orgsettings |
| `b4-addressLine1` | text | - | `payerAddressLine1` | `org-settings.employerAddressLine1` | employer-orgsettings |
| `b4-addressLine2` | text | - | `payerAddressLine2` | `org-settings.employerAddressLine2` | employer-orgsettings |
| `b4-addressPostcode` | text | - | `payerAddressPostcode` | `org-settings.employerAddressPostcode` | employer-orgsettings |
| `b4-addressState` | text | - | `payerAddressState` | `org-settings.employerAddressState` | employer-orgsettings |
| `b4-addressSuburb` | text | - | `payerAddressSuburb` | `org-settings.employerAddressSuburb` | employer-orgsettings |
| `b4-state` | text | - | - | duplicate/unused payer state field | unmapped |
| `b5-contactPerson` | text | - | - | superseded by payer contact name split fields | unmapped |
| `b5-contactPhone` | text | - | `payerContactPhone` | `org-settings.payrollContactPhone` | employer-orgsettings |
| `b5-nameLine1` | text | - | `payerContactNameLine1` | `org-settings.payrollContactName` (split line 1) | employer-orgsettings |
| `b5-nameLine2` | text | - | `payerContactNameLine2` | `org-settings.payrollContactName` (split line 2) | employer-orgsettings |
| `b6-Q` | checkbox export | `x` | - | not used in current flow | unmapped |
| `No` | checkbox/control | - | - | template control element | not-applicable |
| `Print` | button/control | - | - | template control element | not-applicable |
| `Reset` | button/control | - | - | template control element | not-applicable |
| `Save` | button/control | - | - | template control element | not-applicable |
| `Warning` | text/control | - | - | template control element | not-applicable |
| `Yes` | checkbox/control | - | - | template control element | not-applicable |

## NAT3093 (`NAT3093-current.pdf`)

| PDF field name | Field type | Options (if any) | Semantic key (field map) | Current data source | Status |
|---|---|---|---|---|---|
| `1-familyName` | text | - | `surname` | `staff-users.lastName` | filled |
| `1-FirstgivenName` | text | - | `givenNames` | `staff-users.firstName` | filled |
| `1-othergivenName` | text | - | `otherGivenNames` | `staff-users.profile.otherGivenNames` | filled |
| `1-title` | checkbox export | `Miss`, `Mr`, `Mrs`, `Ms` | - | title not collected | unmapped |
| `1-titleOther` | text | - | - | title-other not collected | unmapped |
| `2-busName` | text | - | `payerName` | `org-settings.employerLegalName` | employer-orgsettings |
| `2-dateDay` | text | - | `dateOfBirthDay` | `staff-users.profile.dateOfBirth` (day split) | filled |
| `2-dateMonth` | text | - | `dateOfBirthMonth` | `staff-users.profile.dateOfBirth` (month split) | filled |
| `2-dateYear` | text | - | `dateOfBirthYear` | `staff-users.profile.dateOfBirth` (year split) | filled |
| `7-amount` | text | - | - | rebate amount question not collected | unmapped |
| `ABN` | text | - | `payerAbn` | `org-settings.employerAbn` | employer-orgsettings |
| `DecPayee-dateDay` | text | - | `declarationDateDay` | generated current date (day) | auto-date |
| `DecPayee-dateMonth` | text | - | `declarationDateMonth` | generated current date (month) | auto-date |
| `DecPayee-dateYear` | text | - | `declarationDateYear` | generated current date (year) | auto-date |
| `DecPayer-dateDay` | text | - | `payerDeclarationDateDay` | generated current date when policy is `auto` | auto-date |
| `DecPayer-dateMonth` | text | - | `payerDeclarationDateMonth` | generated current date when policy is `auto` | auto-date |
| `DecPayer-dateYear` | text | - | `payerDeclarationDateYear` | generated current date when policy is `auto` | auto-date |
| `No` | checkbox/control | - | - | template control element | not-applicable |
| `Print` | button/control | - | - | template control element | not-applicable |
| `Q4` | checkbox export | `Australian#20resident`, `Working#20holiday#20maker`, `foreign#20resident` | `residencyStatus` | `taxTask.residencyStatus` | filled |
| `Q5` | checkbox export | `No`, `Yes` | `claimTaxFreeThreshold` | `taxTask.claimTaxFreeThreshold` | filled |
| `Q6` | checkbox export | `No`, `Yes` | `hasStudyLoanDebt` | any of `hasHelpDebt/hasSslDebt/hasTslDebt/hasVslDebt` | filled |
| `Q7` | checkbox export | `No`, `Yes` | `hasFinancialSupplementDebt` | `taxTask.hasSfssDebt` | filled |
| `Q8` | checkbox export | `No`, `Yes` | `hasStudyDebt` | aggregate of Q6 or Q7 debt groups | filled |
| `Q8sub` | checkbox export | `Single`, `couple`, `illness` | `medicareExemption` | `taxTask.medicareExemption` (`none` leaves field blank) | filled |
| `Qtfn` | checkbox | `lodged`, `pensioner`, `under18` | - | currently set true when TFN present | partial |
| `Reset` | button/control | - | - | template control element | not-applicable |
| `Save` | button/control | - | - | template control element | not-applicable |
| `TFN` | text | - | `tfn` | `taxTask.tfn` (or decrypted `staff-users.tfnEncrypted`) | filled |
| `Warning` | text/control | - | - | template control element | not-applicable |
| `Yes` | checkbox/control | - | - | template control element | not-applicable |

## NAT13080 (`NAT13080-2023-04.pdf`)

| PDF field name | Field type | Options (if any) | Semantic key (field map) | Current data source | Status |
|---|---|---|---|---|---|
| `A-EmployeeNo` | text | - | `employeeNumber` | `staff-users.employeeNumber` | partial |
| `A-FullName` | text | - | `employeeName` | `staff-users.firstName` + `staff-users.lastName` | filled |
| `A-SuperChoice` | checkbox export | `Section#20B`, `Section#20C`, `Section#20D` | `superChoice` | derived from `superUseDefaultFund/superUseSmsf` | filled |
| `A-TFN` | text | - | `tfn` | `taxTask.tfn` (or decrypted `staff-users.tfnEncrypted`) | filled |
| `B-ABN` | text | - | `existingFundAbn` | `superTask.superFundAbn` (when Section B selected) | partial |
| `B-Day` | text | - | `declarationDateDay` | generated current date (day) | auto-date |
| `B-MemberAccNo` | text | - | `existingMemberNumber` | `superTask.superMemberNumber` | filled |
| `B-Month` | text | - | `declarationDateMonth` | generated current date (month) | auto-date |
| `B-required` | checkbox | `Attached` | `Brequired` | checked when Section B selected | filled |
| `B-SuperFundName` | text | - | `existingFundName` | `superTask.superFundName` | filled |
| `B-USI` | text | - | `existingFundUsi` | `superTask.superFundId` | filled |
| `B-Year` | text | - | `declarationDateYear` | generated current date (year) | auto-date |
| `B-yourName` | text | - | - | payee declaration name not explicitly mapped | unmapped |
| `C-ABN` | text | - | `employerAbn` | `org-settings.employerAbn` | employer-orgsettings |
| `C-BusinessName` | text | - | `employerName` | `org-settings.employerLegalName` | employer-orgsettings |
| `C-Day` | text | - | `employerDeclarationDay` | generated current date (day) | auto-date |
| `C-Dec` | checkbox export | `no` | `CDec` | checked when Section C selected | filled |
| `C-Month` | text | - | `employerDeclarationMonth` | generated current date (month) | auto-date |
| `C-SuperABN` | text | - | `employerDefaultFundAbn` | `org-settings.defaultSuperFundAbn` | employer-orgsettings |
| `C-SuperFundName` | text | - | `employerDefaultFundName` | `org-settings.defaultSuperFundName` | employer-orgsettings |
| `C-USI` | text | - | `employerDefaultFundUsi` | `org-settings.defaultSuperFundUsi` | employer-orgsettings |
| `C-Year` | text | - | `employerDeclarationYear` | generated current date (year) | auto-date |
| `D-ABN` | text | - | `smsfAbn` | `superTask.smsfAbn` (when Section D selected) | partial |
| `D-accountNumber` | text | - | `smsfAccountNumber` | `superTask.smsfAccountNumber` | partial |
| `D-BankAccountName` | text | - | `smsfBankName` | `superTask.smsfBankName` | partial |
| `D-BSB` | text | - | `smsfBsb` | `superTask.smsfBsb` | partial |
| `D-Day` | text | - | `smsfDeclarationDay` | generated current date (day) | auto-date |
| `D-Dec` | checkbox export | `no` | `DDec` | checked when Section D selected | filled |
| `D-Month` | text | - | `smsfDeclarationMonth` | generated current date (month) | auto-date |
| `D-name` | text | - | - | SMSF declaration name not explicitly mapped | unmapped |
| `D-SMSFESA` | text | - | `smsfEsa` | `superTask.smsfEsa` | partial |
| `D-SMSFName` | text | - | `smsfName` | `superTask.smsfName` | partial |
| `D-Year` | text | - | `smsfDeclarationYear` | generated current date (year) | auto-date |

## Notes

- `NAT3092` does not expose a payer email field in current discovery, so `org-settings.payrollContactEmail` remains stored but not mapped. Payroll phone is normalized to 10 digits for the PDF field limit.
- `NAT13080` has no explicit fields for `authorizedSignatoryName` or `authorizedSignatoryTitle`; those OrgSettings values are captured for future template versions.
- `A-EmployeeNo` remains `partial` because provisioning supports it but many existing users still have blank `employeeNumber`.
# Form Coverage Matrix (Phase 1)

Source inputs:
- Discovery output: `docs/form-audit/discover-output.txt` (generated by `npx tsx scripts/discover-pdf-fields.ts`)
- Field maps: `src/lib/onboarding-pdf/field-maps/`
- Value builders: `src/lib/onboarding-documents.ts`
- Task UIs: `TaxTask`, `SuperTask`, `TaskCompletionForm`
- Employer settings schema: `src/globals/OrgSettings.ts`

Status legend:
- `filled`: mapped and normally populated from current workflow
- `partial`: mapped but conditional/optional or mismatched to PDF semantics
- `hardcoded-empty`: mapped field is currently always an empty string
- `unmapped`: no current field map/value source wiring
- `employer-orgsettings`: field is sourced from employer global settings
- `auto-date`: set automatically at generation time
- `not-applicable`: button/system field not used for data capture

## NAT3092 (NAT3092-06.2019.pdf)

| PDF field | type | options | semantic key | data source | status |
|---|---|---|---|---|---|
| 1-Q | checkbox-export | exempt1, exempt2, separate | — | not wired | unmapped |
| 1-TFN | text | — | tfn | `TaxTask.tfn` or decrypted `user.tfnEncrypted` | filled |
| 2-familyName | text | — | payeeSurname | `user.lastName` | filled |
| 2-firstName | text | — | payeeGivenNames | `user.firstName` | filled |
| 2-otherName | text | — | payeeOtherGivenNames | hardcoded in builder (`''`) | hardcoded-empty |
| 2-title | checkbox-export | Miss, Mr, Mrs, Ms | — | not wired | unmapped |
| 3-addressLine1 | text | — | addressLine1 | `user.profile.addressLine1` | filled |
| 3-addressLine2 | text | — | addressLine2 | hardcoded in builder (`''`) | hardcoded-empty |
| 3-addressPostcode | text | — | postcode | `user.profile.postcode` | filled |
| 3-addressState | text | — | state | `user.profile.state` | filled |
| 3-addressSuburb | text | — | suburb | `user.profile.suburb` | filled |
| 3-state | text | — | — | not wired | unmapped |
| 4-dateDay | text | — | dateOfBirthDay | `user.profile.dateOfBirth` (split) | filled |
| 4-dateMonth | text | — | dateOfBirthMonth | `user.profile.dateOfBirth` (split) | filled |
| 4-dateYear | text | — | dateOfBirthYear | `user.profile.dateOfBirth` (split) | filled |
| 4-nameChange | text | — | — | not wired | unmapped |
| 5-addressLine1 | text | — | — | not wired | unmapped |
| 5-addressLine2 | text | — | — | not wired | unmapped |
| 6-Q | checkbox-export | casual, full-time, labour, part-time, super | employmentBasis | `user.employmentBasis` mapped via `buildEmploymentBasisChecks` | filled |
| 7-Q | checkbox-export | Aust#20resident, foreign#20resident, working#20holiday#20maker | residencyStatus | `TaxTask.residencyStatus` | filled |
| 8-Q | checkbox-export | no, yes | claimTaxFreeThreshold | `TaxTask.claimTaxFreeThreshold` | filled |
| 9-Q | checkbox-export | no, yes | hasStudyDebt | derived OR of HELP/SSL/TSL/VSL/SFSS task flags | filled |
| b1-ABN | text | — | payerAbn | `OrgSettings.employerAbn` | employer-orgsettings |
| b1-branchNumber | text | — | payerBranch | `OrgSettings.payerBranchNumber` | employer-orgsettings |
| b2-Q | checkbox-export | no, yes | — | not wired | unmapped |
| b3-nameLine1 | text | — | payerNameLine1 | `OrgSettings.employerLegalName` (line split) | employer-orgsettings |
| b3-nameLine2 | text | — | payerNameLine2 | `OrgSettings.employerLegalName` (line split) | employer-orgsettings |
| b3-nameLine3 | text | — | payerNameLine3 | `OrgSettings.employerLegalName` (line split) | employer-orgsettings |
| b4-addressLine1 | text | — | — | no OrgSettings field wired | unmapped |
| b4-addressLine2 | text | — | — | no OrgSettings field wired | unmapped |
| b4-addressPostcode | text | — | — | no OrgSettings field wired | unmapped |
| b4-addressState | text | — | — | no OrgSettings field wired | unmapped |
| b4-addressSuburb | text | — | — | no OrgSettings field wired | unmapped |
| b4-state | text | — | — | no OrgSettings field wired | unmapped |
| b5-contactPerson | text | — | — | not wired (uses split-name lines instead) | unmapped |
| b5-contactPhone | text | — | payerContactPhone | `OrgSettings.payrollContactPhone` | employer-orgsettings |
| b5-nameLine1 | text | — | payerContactNameLine1 | `OrgSettings.payrollContactName` (line split) | employer-orgsettings |
| b5-nameLine2 | text | — | payerContactNameLine2 | `OrgSettings.payrollContactName` (line split) | employer-orgsettings |
| b6-Q | checkbox-export | x | — | not wired | unmapped |
| No | button/system | — | — | PDF control | not-applicable |
| Print | button/system | — | — | PDF control | not-applicable |
| Reset | button/system | — | — | PDF control | not-applicable |
| Save | button/system | — | — | PDF control | not-applicable |
| Warning | button/system | — | — | PDF control | not-applicable |
| Yes | button/system | — | — | PDF control | not-applicable |

## NAT3093 (NAT3093-current.pdf)

| PDF field | type | options | semantic key | data source | status |
|---|---|---|---|---|---|
| 1-familyName | text | — | surname | `user.lastName` | filled |
| 1-FirstgivenName | text | — | givenNames | `user.firstName` | filled |
| 1-othergivenName | text | — | otherGivenNames | hardcoded in builder (`''`) | hardcoded-empty |
| 1-title | checkbox-export | Miss, Mr, Mrs, Ms | — | not wired | unmapped |
| 1-titleOther | text | — | — | not wired | unmapped |
| 2-busName | text | — | payerName | `OrgSettings.employerLegalName` | employer-orgsettings |
| 2-dateDay | text | — | dateOfBirthDay | `user.profile.dateOfBirth` (split) | filled |
| 2-dateMonth | text | — | dateOfBirthMonth | `user.profile.dateOfBirth` (split) | filled |
| 2-dateYear | text | — | dateOfBirthYear | `user.profile.dateOfBirth` (split) | filled |
| 7-amount | text | — | — | not wired | unmapped |
| ABN | text | — | payerAbn | `OrgSettings.employerAbn` | employer-orgsettings |
| DecPayee-dateDay | text | — | declarationDateDay | generated from current date | auto-date |
| DecPayee-dateMonth | text | — | declarationDateMonth | generated from current date | auto-date |
| DecPayee-dateYear | text | — | declarationDateYear | generated from current date | auto-date |
| DecPayer-dateDay | text | — | — | not wired | unmapped |
| DecPayer-dateMonth | text | — | — | not wired | unmapped |
| DecPayer-dateYear | text | — | — | not wired | unmapped |
| No | button/system | — | — | PDF control | not-applicable |
| Print | button/system | — | — | PDF control | not-applicable |
| Q4 | checkbox-export | Australian#20resident, Working#20holiday#20maker, foreign#20resident | residencyStatus | `TaxTask.residencyStatus` | filled |
| Q5 | checkbox-export | No, Yes | claimTaxFreeThreshold | `TaxTask.claimTaxFreeThreshold` | filled |
| Q6 | checkbox-export | No, Yes | — | not wired | unmapped |
| Q7 | checkbox-export | No, Yes | — | not wired | unmapped |
| Q8 | checkbox-export | No, Yes | hasStudyDebt | derived OR of HELP/SSL/TSL/VSL/SFSS task flags | partial |
| Q8sub | checkbox-export | Single, couple, illness | medicareExemption | `TaxTask.medicareExemption` (currently boolean UI) | partial |
| Qtfn | checkbox | lodged, pensioner, under18 | Qtfn | derived `Boolean(tfn)` | partial |
| Reset | button/system | — | — | PDF control | not-applicable |
| Save | button/system | — | — | PDF control | not-applicable |
| TFN | text | — | tfn | `TaxTask.tfn` or decrypted `user.tfnEncrypted` | filled |
| Warning | button/system | — | — | PDF control | not-applicable |
| Yes | button/system | — | — | PDF control | not-applicable |

## NAT13080 (NAT13080-2023-04.pdf)

| PDF field | type | options | semantic key | data source | status |
|---|---|---|---|---|---|
| A-EmployeeNo | text | — | employeeNumber | `user.employeeNumber` | partial |
| A-FullName | text | — | employeeName | `${user.firstName} ${user.lastName}` | filled |
| A-SuperChoice | checkbox-export | Section#20B, Section#20C, Section#20D | superChoice | derived from super task choice flags | filled |
| A-TFN | text | — | tfn | `TaxTask.tfn` or decrypted `user.tfnEncrypted` | filled |
| B-ABN | text | — | existingFundAbn | `SuperTask.superFundAbn` (optional) | partial |
| B-Day | text | — | declarationDateDay | generated from current date | auto-date |
| B-MemberAccNo | text | — | existingMemberNumber | `SuperTask.superMemberNumber` (when own fund path) | partial |
| B-Month | text | — | declarationDateMonth | generated from current date | auto-date |
| B-required | checkbox | Attached | Brequired | derived `!useDefault && !useSmsf` | partial |
| B-SuperFundName | text | — | existingFundName | `SuperTask.superFundName` (when own fund path) | partial |
| B-USI | text | — | existingFundUsi | `SuperTask.superFundId` (when own fund path) | partial |
| B-Year | text | — | declarationDateYear | generated from current date | auto-date |
| B-yourName | text | — | — | not wired | unmapped |
| C-ABN | text | — | — | not wired (likely employer ABN field) | unmapped |
| C-BusinessName | text | — | employerName | `OrgSettings.employerLegalName` | employer-orgsettings |
| C-Day | text | — | employerDeclarationDay | generated from current date | auto-date |
| C-Dec | checkbox-export | no | CDec | derived `useDefault` | partial |
| C-Month | text | — | employerDeclarationMonth | generated from current date | auto-date |
| C-SuperABN | text | — | employerDefaultFundAbn | `OrgSettings.defaultSuperFundAbn` | partial |
| C-SuperFundName | text | — | employerDefaultFundName | `OrgSettings.defaultSuperFundName` | employer-orgsettings |
| C-USI | text | — | employerDefaultFundUsi | `OrgSettings.defaultSuperFundUsi` | employer-orgsettings |
| C-Year | text | — | employerDeclarationYear | generated from current date | auto-date |
| D-ABN | text | — | smsfAbn | `SuperTask.smsfAbn` (SMSF path only) | partial |
| D-accountNumber | text | — | smsfAccountNumber | `SuperTask.smsfAccountNumber` (SMSF path only) | partial |
| D-BankAccountName | text | — | smsfBankName | `SuperTask.smsfBankName` (SMSF path only) | partial |
| D-BSB | text | — | smsfBsb | `SuperTask.smsfBsb` (SMSF path only) | partial |
| D-Day | text | — | smsfDeclarationDay | generated from current date | auto-date |
| D-Dec | checkbox-export | no | DDec | derived `useSmsf` | partial |
| D-Month | text | — | smsfDeclarationMonth | generated from current date | auto-date |
| D-name | text | — | — | not wired | unmapped |
| D-SMSFESA | text | — | smsfEsa | `SuperTask.smsfEsa` (SMSF path only) | partial |
| D-SMSFName | text | — | smsfName | `SuperTask.smsfName` (SMSF path only) | partial |
| D-Year | text | — | smsfDeclarationYear | generated from current date | auto-date |

