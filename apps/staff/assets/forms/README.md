Official onboarding templates belong in this folder.

Required files (official forms only):

- `NAT3092-06.2019.pdf` (ATO TFN declaration, NAT 3092)
- `NAT3093-current.pdf` (ATO withholding declaration, NAT 3093)
- `NAT13080-2023-04.pdf` (ATO super standard choice, NAT 13080)
- `FWIS-current.pdf` (Fair Work Information Statement)
- `CEIS-current.pdf` (Casual Employment Information Statement)
- `FTCIS-current.pdf` (Fixed Term Contract Information Statement)

Source links:

- [ATO TFN declaration](https://www.ato.gov.au/forms-and-instructions/tfn-declaration)
- [ATO withholding declaration](https://www.ato.gov.au/forms-and-instructions/withholding-declaration)
- [ATO superannuation standard choice form](https://www.ato.gov.au/forms-and-instructions/superannuation-standard-choice-form)
- [Fair Work information statements](https://www.fairwork.gov.au/employment-conditions/information-statements)

Notes:

- Keep official PDF filenames pinned as above so field maps resolve consistently.
- If any template revision changes, add the new file alongside the old one, update Org Settings template versions, and rerun PDF field map checks.
- `FTCIS-current.pdf` must be downloaded manually from [fairwork.gov.au/ftcis](https://www.fairwork.gov.au/employment-conditions/information-statements/fixed-term-contract-information-statement) (FWO URL changes frequently).
- Validate templates: `npm run check:onboarding-pdf-field-maps --workspace=@flaus/staff`
