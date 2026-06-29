# Training UI research (Mobbin elevation)

Research sprint for FLAUS Staff Hub `/training` and module detail UX. Benchmarks award-tier learning products via [Mobbin](https://mobbin.com).

## Before scores (2026-06-27 baseline)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual hierarchy | 4/10 | Duplicate "TRAINING MODULE" eyebrow; 4–5 stacked cards |
| Readability | 4/10 | Raw `**bold**`, inline URLs, no markdown |
| Progress clarity | 5/10 | Tiny dot bar; duplicate step/time labels |
| Time honesty | 3/10 | `blockCount × 3` inflated durations (e.g. 33 min WHS induction) |
| Media & resources | 2/10 | PDFs as plain URL text; video type unused |
| Focus / flow | 5/10 | Header + confirm + footer as separate cards |
| List scanability | 5/10 | Dense secondary line; redundant per-row progress bars |
| Accessibility | 6/10 | Good touch targets; mixed token usage |
| Motivation | 4/10 | No sidebar steps, resource cards, or resume CTA |
| Mobile | 6/10 | No sticky nav |

**Program average (before): 4.4 / 10**

## Mobbin benchmark set

| Pattern | Source | Link | FLAUS application |
|---------|--------|------|-------------------|
| Onboarding task cards | Deputy | [Welcome/tasks](https://mobbin.com/screens/555bcc50-9f56-4a55-a8cd-272c3f6f6dd6) | Training list cards with status + duration badge |
| Side checklist + active step | Deputy | [Split onboarding](https://mobbin.com/screens/96821200-475d-4e5c-8e21-5e33d673d7ff) | `TrainingStepSidebar` with done/active/locked |
| Course progress + Resume | Optimal Workshop | [Completing a lesson](https://mobbin.com/flows/4e583867-00db-4493-b45e-2e2a03ba35c3) | `TrainingModuleHero` segmented bar + time |
| Video + transcript card | LinkedIn | [Interview prep](https://mobbin.com/screens/af747c08-6aa7-43ef-a733-07f7cb6e6176) | `TrainingVideoBlock` + resource rows |
| Single-screen + sticky Continue | Duolingo | [Completing a lesson](https://mobbin.com/flows/d27dcac0-e266-49cc-8133-abbf05fb5b74) | `TrainingStickyNav` |
| B2B course flow | Front | [Taking a course](https://mobbin.com/flows/d8610432-7664-4866-8655-3df8bbae3cc2) | Compliance tone reference |
| Deputy Essentials sidebar | Deputy | Course sidebar with % progress | Step list with per-step minutes |

## Pattern extraction matrix

1. **Module hero** — title, hook, segmented progress, total/remaining time (`TrainingModuleHero`)
2. **Step sidebar** — numbered steps, checkmarks, click-back on completed (`TrainingStepSidebar`)
3. **Single player surface** — one H2 per step, no duplicate eyebrow (`TrainingPlayer`)
4. **Resource cards** — PDF/link with Open + Download (`TrainingResourceBlock`)
5. **Sticky action bar** — Back / Continue / Finish (`TrainingStickyNav`)
6. **Inline feedback** — quiz errors in sticky nav banner
7. **List simplification** — status pill + `~N min` badge; single overall progress bar
8. **Typography** — `--cmd-*` tokens, `text-lg` step titles, `TrainingMarkdown`
9. **Plain-language markdown** — bold, bullets, numbered lists rendered
10. **Completion** — success card before redirect (unchanged compliance storage)

## After scores (post-implementation target)

| Dimension | Target | Implementation |
|-----------|--------|----------------|
| Visual hierarchy | 8/10 | Hero + sidebar + single player; sticky nav |
| Readability | 8/10 | `TrainingMarkdown`; resource cards replace URL dumps |
| Progress clarity | 8/10 | Sidebar labels; hero bar; per-step minutes |
| Time honesty | 9/10 | Per-block weights; optional `estimatedMinutes`; cap 12 min |
| Media & resources | 8/10 | `resource` block; WorkSafe PDF download on `whs-remote-work` |
| Focus / flow | 8/10 | One primary content surface per step |
| List scanability | 8/10 | Deputy-style cards; duration badge |
| Accessibility | 8/10 | 44px targets; `aria-current="step"`; transcript accordion |
| Motivation | 7/10 | Step checklist; clearer CTAs (no gamification) |
| Mobile | 8/10 | Horizontal step chips; sticky bottom nav |

**Program average (after): 8.0 / 10**

## FLAUS constraints (held)

- Grade 6–8 plain language; no timers or punitive fail states
- Attestation + quiz responses still stored on completion
- WorkSafe / OAIC resources use domain allowlist
- Staff demographic 18–40, many with disability — one screen at a time preserved

## Key modules to verify

- `/training` — list cards, overall progress, `~6 min` on remote work
- `/training/whs-remote-work` — PDF resource with Download; sidebar steps
- `/training/whs-induction` — ~9 min total; markdown bold/lists render

## Related

- [`ui-references.md`](ui-references.md)
- [`training-content-acceptance.md`](training-content-acceptance.md) — C9–C11 UI criteria
