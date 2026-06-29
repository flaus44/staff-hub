# Data handling & privacy — co-design Session Capture

**Data custodian:** Financial Literacy Australia (FLAUS)  
**Privacy contact:** mentors@flaus.com.au  
**Section 8 contact data viewer:** Daniel Ross (admin flag `contactDataViewer`)  
**Project:** Monash 51358 — Co-Design Pack V2.0  
**Scope:** FLAUS is **not** a registered NDIS provider. Co-design facilitators do **not** deliver NDIS supports.

## Data classes

| Class | Content | Storage | Retention |
|-------|---------|---------|-----------|
| A — Session research | Sections 1–7 observations, ratings | `survey-responses` (session capture) | Project + 12 months → export → delete |
| B — Verbatim quotes | Exact participant words in Section 9 | Same record, flagged in metadata | Same as A |
| C — Facilitator notes | Problems, severity (after participant leaves) | Same record | Same as A |
| D — Section 8 contact | Name, phone, email, support coordinator | **`session-contact-details`** (separate) | Purpose fulfilled + 90 days |
| E — Practice captures | Mock/training sessions | `survey-responses` with `captureMode: practice` | **30 days** auto-delete |
| F — Training evidence | Quiz answers, attestations | `training-completions` | **7 years** |

## Facilitator rules (plain language)

1. Read **Section 7 word-for-word** every session — do not paraphrase.
2. **Section 8** contact details only if the participant said **Yes** in Section 7.
3. Never copy contact details into quotes or facilitator notes.
4. Use the participant's **exact words** in quote fields — do not add names or NDIS numbers elsewhere.
5. Complete **Section 9 facilitator notes after** the participant has left.
6. Work from a **private screen**; lock your device when away.
7. Report data problems within **24 hours** to mentors@flaus.com.au — do not investigate breaches yourself.
8. Direct participant privacy questions to **mentors@flaus.com.au**, not your personal email.

## Cross-border disclosure (APP 8)

Staff Hub production data may be processed on servers in **Singapore** (Render). Participant information entered in Session Capture may be stored outside Australia. This is disclosed in Section 7 scripts and at login for staff.

## Access control

- Facilitators: own session captures only.
- Managers: team session captures **without** Section 8 contact details.
- `contactDataViewer` (Daniel): Section 8 contact records only.
- Admins: full access; exports are audit-logged.

## Notifiable Data Breaches

Suspected eligible breaches (lost device, wrong export, unauthorised access) → report to mentors@flaus.com.au within 24 hours. Privacy lead assesses OAIC notification within 30 days.

See `docs/privacy-incident-runbook.md` for operational steps.
