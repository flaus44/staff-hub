import type { SurveyField } from '@/lib/survey-field'
import { SECTION_7_SCRIPT } from '@/lib/survey-field'

/** Session Capture Form V2.0 — digital field schema (live + practice share shape). */
export function buildSessionCaptureFields(mode: 'live' | 'practice'): SurveyField[] {
  const prefix = mode === 'practice' ? 'practice_' : ''

  return [
    {
      id: `${prefix}session_header`,
      type: 'section',
      label: mode === 'practice' ? 'Practice session — not saved as live data' : 'Session details',
      step: 1,
      stepTitle: 'Session details',
    },
    {
      id: `${prefix}session_date`,
      type: 'text',
      label: 'Date',
      required: true,
      step: 1,
      fieldRole: 'participant_response',
    },
    {
      id: `${prefix}session_number`,
      type: 'text',
      label: 'Session number',
      required: true,
      step: 1,
      fieldRole: 'participant_response',
    },
    {
      id: `${prefix}participant_id`,
      type: 'text',
      label: 'Participant ID (pseudonymous code only — not full name)',
      required: true,
      step: 1,
      helpText: 'Use the code provided by FLAUS. Do not enter real names here.',
      fieldRole: 'participant_response',
    },
    {
      id: `${prefix}facilitator_name`,
      type: 'text',
      label: 'Facilitator',
      required: true,
      step: 1,
      fieldRole: 'facilitator_note',
    },
    {
      id: `${prefix}welcome_header`,
      type: 'section',
      label: 'Welcome — read aloud',
      step: 2,
      stepTitle: 'Welcome script',
    },
    {
      id: `${prefix}welcome_script`,
      type: 'script',
      label: 'Say this before you begin',
      step: 2,
      fieldRole: 'script',
      scriptText:
        'Thank you for helping us today.\nWe are trying out a program and we would like your feedback.\nThere are no right or wrong answers.\nYou can stop, take a break, or skip any question at any time.\nJust let me know.',
    },
    {
      id: `${prefix}activity_notes`,
      type: 'textarea',
      label: 'What did they do? Use their exact words where possible.',
      required: true,
      step: 3,
      stepTitle: 'During the session',
      helpText: 'Golden rule: Don\'t teach. Let them try. Say: "Show me what you would do."',
      fieldRole: 'participant_response',
    },
    {
      id: `${prefix}s7_header`,
      type: 'section',
      label: 'Section 7 — read word-for-word',
      step: 4,
      stepTitle: 'Section 7 disclosure',
    },
    {
      id: `${prefix}s7_script`,
      type: 'script',
      label: 'Read aloud — do not paraphrase',
      step: 4,
      fieldRole: 'script',
      scriptText: SECTION_7_SCRIPT,
    },
    {
      id: `${prefix}s7_wants_program`,
      type: 'yesno',
      label: 'If this program were ready tomorrow, would they want to use it? (not as co-designer)',
      required: true,
      step: 4,
      fieldRole: 'participant_response',
    },
    {
      id: `${prefix}s7_reason`,
      type: 'textarea',
      label: 'One reason for their answer (their words)',
      step: 4,
      fieldRole: 'participant_response',
    },
    {
      id: `${prefix}s8_header`,
      type: 'section',
      label: 'Section 8 — contact details (only if Yes above)',
      step: 5,
      stepTitle: 'Contact details',
      showWhen: { fieldId: `${prefix}s7_wants_program`, equals: 'yes' },
    },
    {
      id: `${prefix}s8_contact_name`,
      type: 'text',
      label: 'Name',
      required: true,
      step: 5,
      fieldRole: 'contact_pii',
      showWhen: { fieldId: `${prefix}s7_wants_program`, equals: 'yes' },
    },
    {
      id: `${prefix}s8_contact_email`,
      type: 'text',
      label: 'Email',
      step: 5,
      fieldRole: 'contact_pii',
      showWhen: { fieldId: `${prefix}s7_wants_program`, equals: 'yes' },
    },
    {
      id: `${prefix}s8_contact_phone`,
      type: 'text',
      label: 'Phone',
      step: 5,
      fieldRole: 'contact_pii',
      showWhen: { fieldId: `${prefix}s7_wants_program`, equals: 'yes' },
    },
    {
      id: `${prefix}s9_header`,
      type: 'section',
      label: 'Section 9 — after participant leaves',
      step: 6,
      stepTitle: 'Facilitator notes',
      helpText: 'Complete this section after the participant has left.',
    },
    {
      id: `${prefix}s9_quote_1`,
      type: 'textarea',
      label: 'Best quote 1 (exact words)',
      step: 6,
      fieldRole: 'facilitator_note',
    },
    {
      id: `${prefix}s9_quote_2`,
      type: 'textarea',
      label: 'Best quote 2 (exact words)',
      step: 6,
      fieldRole: 'facilitator_note',
    },
    {
      id: `${prefix}s9_problem_1`,
      type: 'textarea',
      label: 'Top problem observed — what happened?',
      step: 6,
      fieldRole: 'facilitator_note',
    },
  ]
}

export const SESSION_CAPTURE_LIVE_SLUG = 'session-capture-v2-live'
export const SESSION_CAPTURE_PRACTICE_SLUG = 'session-capture-v2-practice'

export const CO_DESIGN_TRAINING_SLUGS = [
  'codesign-golden-rule',
  'codesign-before-session',
  'codesign-welcome-script',
  'codesign-during-session',
  'codesign-distress-responses',
  'codesign-section-7',
  'codesign-section-8',
  'codesign-quotes-notes',
  'codesign-privacy-basics',
  'codesign-practice-capture',
] as const

export const CO_DESIGN_MODULE_TITLES: Record<(typeof CO_DESIGN_TRAINING_SLUGS)[number], string> = {
  'codesign-golden-rule': 'Golden rule — don\'t teach',
  'codesign-before-session': 'Before the session',
  'codesign-welcome-script': 'Welcome script',
  'codesign-during-session': 'During the session',
  'codesign-distress-responses': 'If someone is confused, tired, upset, or wants to stop',
  'codesign-section-7': 'Section 7 — say every word',
  'codesign-section-8': 'Section 8 — contact details rules',
  'codesign-quotes-notes': 'Quotes and notes after they leave',
  'codesign-privacy-basics': 'What not to put in the form',
  'codesign-practice-capture': 'Practice session capture',
}
