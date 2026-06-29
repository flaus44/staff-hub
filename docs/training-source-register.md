# Training source register

Approved external sources for Financial Literacy Australia Staff Hub training content. **No source may enter seed until a row exists and a compliance reviewer initials it.**

Financial Literacy Australia is **not** a registered NDIS provider. Do not use NDIS Worker Orientation or NDIS Practice Standards modules.

| ID | Source | URL | Used in module | Usage mode | Review date | Reviewer |
|----|--------|-----|----------------|------------|-------------|----------|
| WS-VIC-WFH | WorkSafe VIC WFH checklist | https://content-v2.api.worksafe.vic.gov.au/sites/default/files/2024-12/Working-from-home-safety-wellbeing-checklist-2024-12.pdf | `whs-remote-work` | FLA 8-item self-check + full checklist link | 2026-06-27 | DR |
| WS-VIC-OFFICE | WorkSafe VIC office OHS employer guide | https://www.worksafe.vic.gov.au/safety-and-prevention | `whs-induction` | Summarise hazards + link | 2026-06-27 | DR |
| WS-VIC-REMOTE | WorkWell remote/isolated work toolkit | https://www.worksafe.vic.gov.au/workwell-toolkit-remote-or-isolated-work | `whs-remote-work` | Psychosocial hazards + check-in policy | 2026-06-27 | DR |
| WS-VIC-OHS-ACT | OHS Act 2004 (VIC) s21 / s25 | https://www.worksafe.vic.gov.au/ | `whs-induction` | Plain-language employer/worker duties | 2026-06-27 | DR |
| OAIC-APP | OAIC employee privacy summary | https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information-at-work | `privacy-basics-staff` | Plain summary + link | 2026-06-27 | DR |
| INTERNAL-S7 | Section 7 script | `apps/staff/src/lib/survey-field.ts` | `codesign-section-7` | Verbatim + plain summary | 2026-06-27 | DR |
| INTERNAL-PRIVACY | Data handling & privacy doc | `docs/data-handling-and-privacy.md` | `privacy-data-handling`, `codesign-privacy-basics` | FLA-authored mirror | 2026-06-27 | DR |
| INTERNAL-INCIDENT | Staff portal Incidents workflow | `/incidents` | `incident-reporting-procedure`, `whs-induction` | Step-by-step portal path (5 categories) | 2026-06-29 | DR |
| WS-QLD-HOME-OFFICE | Work Safe QLD home office setup | https://www.youtube.com/watch?v=jFujvZxx9JU | Training hub `hazards-video` | FLA wrapper + transcript; maps to injury/property | 2026-06-29 | DR |
| WS-VIC-BULLYING | WorkSafe VIC workplace bullying | https://www.youtube.com/watch?v=Mfk7I41RRfw | Training hub `video-bullying` | FLA wrapper; psychosocial category | 2026-06-29 | DR |
| WS-VIC-GENDERED-VIOLENCE | WorkSafe VIC gendered violence | https://www.youtube.com/watch?v=rQ3I1qF-2ws | Training hub `video-gendered-violence` | FLA wrapper; psychosocial category | 2026-06-29 | DR |
| WS-VIC-AGGRESSION | WorkSafe VIC aggression at work | https://www.youtube.com/watch?v=yF0hoKqgxWI | Training hub `video-aggression` | FLA wrapper; psychosocial/injury | 2026-06-29 | DR |
| WS-VIC-FATIGUE | WorkSafe VIC fatigue | https://www.youtube.com/watch?v=Tt5_OMy3M6k | Training hub `video-fatigue` | FLA wrapper; psychosocial category | 2026-06-29 | DR |
| WS-VIC-VIOLENCE-RISK | WorkSafe VIC violence risk management | https://www.youtube.com/watch?v=cLZj_BRrJug | Training hub `video-violence-risk` | FLA wrapper; near miss/psychosocial | 2026-06-29 | DR |
| WS-VIC-PSYCH-GUIDE | WorkSafe VIC psychosocial hazards | https://www.worksafe.vic.gov.au/safety-and-prevention/health-and-safety-topics/psychological-health | `whs-psychosocial-deep-dive` | Plain-language summary + hub video links | 2026-06-29 | DR |
| WS-VIC-FATIGUE-MOD | WorkSafe VIC fatigue (module) | https://www.youtube.com/watch?v=Tt5_OMy3M6k | `whs-fatigue-and-workload` | Hub deep link only — no embed | 2026-06-29 | DR |
| WS-VIC-AGGRESSION-MOD | WorkSafe VIC aggression (module) | https://www.youtube.com/watch?v=yF0hoKqgxWI | `whs-aggression-and-violence` | Hub deep link only | 2026-06-29 | DR |
| WS-QLD-ERGONOMICS | Work Safe QLD home office (module) | https://www.youtube.com/watch?v=jFujvZxx9JU | `whs-home-ergonomics` | Hub deep link only | 2026-06-29 | DR |
| WS-VIC-REMOTE-MOD | WorkWell remote/isolated (module) | https://www.worksafe.vic.gov.au/workwell-toolkit-remote-or-isolated-work | `whs-working-alone` | Check-ins + 000; PDF stays in remote-work | 2026-06-29 | DR |
| WS-VIC-OHS-CONSULT | OHS Act consultation s21/s35 | https://www.worksafe.vic.gov.au/ | `whs-consultation-and-rights` | Plain-language worker rights | 2026-06-29 | DR |

## Hub video requirements (v7)

Each WorkSafe embed on `/training` must have:

1. **2–3 sentence FLA wrapper** in the card `body` (Financial Literacy Australia on first mention).
2. **Transcript** in seed (`TrainingVideoBlock` accordion).
3. **Incident category mapping** in wrapper copy (injury / near miss / property / psychosocial).

## v7 dedup rule

Hub video URLs must **not** appear as `resource` blocks inside training modules. Modules link to `#video-*` anchors on `/training` only. PDF and WorkWell link cards live **only** in `whs-remote-work`.

## Excluded sources (do not use)

- NDIS Worker Orientation Module
- Safe Work Australia generic packs without VIC OHS mapping
- Third-party “free training video” bulk embeds without transcript and FLA wrapper
- Dead embed `8qQR0Mh2Hn0` (replaced by WS-QLD-HOME-OFFICE `jFujvZxx9JU`)
