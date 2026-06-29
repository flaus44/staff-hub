# Session Capture Form V2.0 — digital spec

**Product:** In-app form in Co-design hub (`/surveys`) — **not a PDF**.  
**Templates:** `session-capture-v2-live` and `session-capture-v2-practice`  
**Form version:** 2.0  
**Project:** Monash 51358  

## Golden rule

Don't teach. Let them try. Say: *"Show me what you would do."*

## Digital implementation

- Multi-step wizard (`DynamicSurveyForm` + conditional Section 8)
- Section 8 contact PII → **`session-contact-details`** collection (never in main `answers` JSON)
- Draft save via **`survey-response-drafts`**
- Live submit gated: Track B training complete + practice capture pass
- Submit attestations on final step
- Privacy contact: mentors@flaus.com.au

## Section 7 disclosure (verbatim — do not edit without legal sign-off)

Facilitators must read aloud word-for-word. Includes: education only; not registered NDIS provider; not financial/legal/tax advice; outcomes not guaranteed.

## Post-submit

Digital submission replaces paper return. Admin export via Payload / `surveyExport` and dedicated contact export.
