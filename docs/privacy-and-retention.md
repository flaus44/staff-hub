# Privacy and retention — FLAUS Staff Hub

## Collection notice (shown at login)

Staff and contractor personal information is collected for employment administration, WHS, training compliance, and co-design project operations. Co-design session data is collected for Monash 51358 research purposes under FLAUS as data custodian. Privacy enquiries: **mentors@flaus.com.au**. Data is stored in a dedicated PostgreSQL database separate from NDIS participant records.

## Cross-border disclosure (APP 8)

Production hosting uses Render **Singapore** region. Staff PII may be processed outside Australia. This is disclosed at login. Evaluate Supabase Sydney if AU-only residency becomes required.

## Retention schedules

| Data type | Retention |
|-----------|-----------|
| Time entries & corrections | 7 years (Fair Work) |
| Contract signatures | 7 years post-employment |
| Workplace incidents | 5+ years (WHS) |
| Session capture (research) | Project duration + 12 months, then export to Monash & delete |
| Section 8 contact details | Purpose fulfilled + 90 days (max project + 12 months) |
| Practice / mock captures | 30 days, then auto-delete |
| Training completions | 7 years post-engagement |
| Audit logs | 7 years |
| Contractor accounts | Deactivate at `expiresAt`; delete PI per offboarding procedure |

## Participant PII guardrail

Surveys and incident reports must not become a shadow participant datastore. Forms display warnings; admins configure templates to minimise free-text collection of NDIS participant identifiers.

## Contractor offboarding

1. Export assigned survey responses (CSV)
2. Set account `status: inactive`
3. Schedule PI deletion per retention policy
