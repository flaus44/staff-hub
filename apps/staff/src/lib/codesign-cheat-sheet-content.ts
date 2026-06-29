import { PRIVACY_CONTACT_EMAIL, SECTION_7_SCRIPT } from '@/lib/survey-field'

export const CHEAT_SHEET_VERSION = '2026-06-29'

export const CHEAT_SHEET_PDF_PATH = '/job-aids/codesign-facilitator-cheat-sheet.pdf'

export type CheatSheetCalloutKind = 'script' | 'quote' | 'warning' | 'tip'

export type CheatSheetDistressScenario = {
  title: string
  words: string
}

export type CheatSheetExample = {
  label: 'Good' | 'Bad'
  text: string
}

export type CheatSheetSection =
  | {
      id: string
      kind: 'cover'
      title: string
      subtitle: string
      howToUse: string[]
    }
  | {
      id: string
      kind: 'checklist'
      title: string
      items: string[]
    }
  | {
      id: string
      kind: 'bullets'
      title: string
      intro?: string
      items: string[]
    }
  | {
      id: string
      kind: 'callout'
      title: string
      calloutKind: CheatSheetCalloutKind
      body: string
      note?: string
    }
  | {
      id: string
      kind: 'rules'
      title: string
      items: string[]
    }
  | {
      id: string
      kind: 'distress'
      title: string
      intro?: string
      scenarios: CheatSheetDistressScenario[]
    }
  | {
      id: string
      kind: 'examples'
      title: string
      examples: CheatSheetExample[]
      note?: string
    }
  | {
      id: string
      kind: 'privacy'
      title: string
      ok: string
      never: string
      note: string
    }
  | {
      id: string
      kind: 'help'
      title: string
      email: string
    }

export const CHEAT_SHEET_SECTIONS: CheatSheetSection[] = [
  {
    id: 'cover',
    kind: 'cover',
    title: 'FLAUS Co-design Facilitator Cheat Sheet',
    subtitle: 'Monash 51358 · Financial Literacy Australia',
    howToUse: ['Read scripts word-for-word. Keep this sheet beside you during sessions.'],
  },
  {
    id: 'before-session',
    kind: 'checklist',
    title: 'Before the session',
    items: [
      'Consent signed and on file',
      'Device set up and charged',
      'Quiet, accessible space',
      'Water and break plan discussed',
      'Session Capture form open',
    ],
  },
  {
    id: 'welcome',
    kind: 'bullets',
    title: 'Welcome — read aloud',
    items: [
      'Thank you for helping us today.',
      'There are no right or wrong answers.',
      'You can stop, take a break, or skip any question at any time.',
    ],
  },
  {
    id: 'privacy-disclosure',
    kind: 'callout',
    title: 'Privacy disclosure — read word-for-word',
    calloutKind: 'script',
    body: SECTION_7_SCRIPT,
    note: 'Do not paraphrase. Includes overseas storage disclosure.',
  },
  {
    id: 'contact-details',
    kind: 'rules',
    title: 'Contact details',
    items: [
      'Record only if participant agreed in privacy step',
      'Store separately — never in quotes or notes',
      'If not agreed, leave contact fields blank',
    ],
  },
  {
    id: 'during-session',
    kind: 'bullets',
    title: 'During the session',
    items: [
      'Read scripts as written',
      'Let them explore — do not teach',
      'Use their exact words in notes',
    ],
  },
  {
    id: 'ten-second-rule',
    kind: 'callout',
    title: '10-second wait',
    calloutKind: 'tip',
    body: 'When they pause, count to ten silently before you speak.',
    note: 'If still stuck, say: "Show me what you would do."',
  },
  {
    id: 'golden-rule',
    kind: 'callout',
    title: 'Golden rule — do not teach',
    calloutKind: 'quote',
    body: 'Show me what you would do.',
    note: 'If you help too much, we cannot use the session data.',
  },
  {
    id: 'distress',
    kind: 'distress',
    title: 'If the participant seems…',
    intro: 'Use these exact words:',
    scenarios: [
      {
        title: 'Confused',
        words:
          "That's really helpful — the fact that it's confusing is exactly what we need to know.",
      },
      {
        title: 'Tired',
        words: 'Would you like a break? We can pause or finish up whenever you\'re ready.',
      },
      {
        title: 'Distressed',
        words: "We can stop here. You've been really helpful. Do not push further.",
      },
      {
        title: 'Wants to stop',
        words: 'Thank them and end the session. Note where you stopped.',
      },
    ],
  },
  {
    id: 'quotes-notes',
    kind: 'examples',
    title: 'Quotes and notes',
    examples: [
      {
        label: 'Good',
        text: 'I would tap here but I am not sure what happens next.',
      },
      {
        label: 'Bad',
        text: 'Sarah (NDIS 123456) said she would tap here.',
      },
    ],
    note: 'Complete facilitator notes after the participant has left.',
  },
  {
    id: 'privacy-basics',
    kind: 'privacy',
    title: 'What not to put in the form',
    ok: 'Observations, ratings, exact quotes — no extra identifiers.',
    never: 'Full names, NDIS numbers, or contact details in quotes.',
    note: 'Data may be stored outside Australia (including Singapore).',
  },
  {
    id: 'privacy-help',
    kind: 'help',
    title: 'Privacy help',
    email: PRIVACY_CONTACT_EMAIL,
  },
]

export function cheatSheetPdfUrl(version = CHEAT_SHEET_VERSION): string {
  return `${CHEAT_SHEET_PDF_PATH}?v=${encodeURIComponent(version)}`
}

export const CHEAT_SHEET_TITLE = 'FLAUS Co-design Facilitator Cheat Sheet'

export function cheatSheetPdfHref(version = CHEAT_SHEET_VERSION): string {
  return cheatSheetPdfUrl(version)
}
