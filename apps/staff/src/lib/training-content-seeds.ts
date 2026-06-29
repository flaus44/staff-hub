import type { TrainingContentBlock, TrainingQuizDefinition } from '@/lib/training-content-types'
import { SECTION_7_SCRIPT } from '@/lib/survey-field'

export type TrainingVideoTile = {
  id: string
  title: string
  body?: string
  videoUrl: string
  transcript: string
  durationMinutes?: number
}

/** WorkSafe VIC / SafeWork NSW / Work Safe QLD clips shown on the Training hub page. */
export const WHS_WORKSAFE_VIDEOS: TrainingVideoTile[] = [
  {
    id: 'hazards-video',
    title: 'Setting up your home office safely',
    body: 'Financial Literacy Australia uses this Work Safe Queensland clip as part of WHS Induction. Poor workstation setup can lead to **injury** or **property damage** (e.g. damaged equipment). Report ongoing pain or equipment damage via Incidents — category **Injury** or **Property damage**.',
    videoUrl: 'https://www.youtube.com/embed/jFujvZxx9JU?worksafe=vic',
    durationMinutes: 4,
    transcript:
      'Set your monitor at eye level, about an arm\'s length away. Adjust your chair so feet are flat on the floor and knees are at right angles. Keep keyboard and mouse at elbow height, directly in front of you. Vary your posture — take breaks from sitting, and if you have a sit-stand desk, use it. Poor desk setup can cause injury over time; set up your workstation before long home-office sessions. If pain persists, report it as an injury via Incidents in Staff Hub.',
  },
  {
    id: 'video-bullying',
    title: 'Workplace bullying — employee rights',
    body: 'Financial Literacy Australia requires facilitators to recognise bullying as a **psychosocial** hazard. Repeated unreasonable behaviour that risks health and safety is reportable — use Incidents category **Psychosocial**.',
    videoUrl: 'https://www.youtube.com/embed/Mfk7I41RRfw?worksafe=vic',
    durationMinutes: 3,
    transcript:
      'WorkSafe Victoria explains workplace bullying: repeated unreasonable behaviour that creates a risk to health and safety. Bullying is not reasonable management action. You have the right to a safe workplace. Report bullying to your employer and seek support. If you experience bullying while working for Financial Literacy Australia, report it via Incidents in Staff Hub (category Psychosocial) or email mentors@flaus.com.au.',
  },
  {
    id: 'video-gendered-violence',
    title: 'What is work-related gendered violence?',
    body: 'This WorkSafe Victoria clip covers gendered violence and sexual harassment at work — a **psychosocial** incident category in Staff Hub. Report via Incidents or mentors@flaus.com.au.',
    videoUrl: 'https://www.youtube.com/embed/rQ3I1qF-2ws?worksafe=vic',
    durationMinutes: 3,
    transcript:
      'Work-related gendered violence includes behaviour directed at a person because of their gender, sexual orientation, or sex characteristics. It can include sexual harassment, assault, and threatening behaviour. Employers must provide a safe workplace. Report incidents through Staff Hub Incidents (category Psychosocial) or mentors@flaus.com.au.',
  },
  {
    id: 'video-aggression',
    title: 'Aggression or violence in the workplace',
    body: 'Financial Literacy Australia remote facilitators may face aggression on calls. Physical threats are **Psychosocial** (or **Injury** if harmed). You can pause or stop a session. Report violence or threats via Incidents.',
    videoUrl: 'https://www.youtube.com/embed/yF0hoKqgxWI?worksafe=vic',
    durationMinutes: 3,
    transcript:
      'Workplace violence includes physical assault, threats, and aggressive behaviour. It can come from colleagues, clients, or others. Employers must identify risks and put controls in place. If you feel unsafe during a session, you can pause or stop. Report violence or threats via Incidents in Staff Hub — category Psychosocial or Injury as appropriate.',
  },
  {
    id: 'video-fatigue',
    title: 'Fatigue in the workplace',
    body: 'Fatigue from long remote session days is a **psychosocial** hazard. Financial Literacy Australia expects you to take breaks and report workload concerns that affect your safety.',
    videoUrl: 'https://www.youtube.com/embed/Tt5_OMy3M6k?worksafe=vic',
    durationMinutes: 3,
    transcript:
      'Fatigue is extreme tiredness from long hours, poor sleep, or stress. Signs include difficulty concentrating, irritability, and slower reactions. Take regular breaks, maintain sleep routines, and tell us if workload is affecting your safety. Long solo session days increase fatigue risk — plan breaks every hour. Report sustained fatigue concerns via Incidents (category Psychosocial).',
  },
  {
    id: 'video-violence-risk',
    title: 'Managing the risk of violence and aggression',
    body: 'Employers must manage violence risks. Workers should report **near misses** (something almost went wrong) and actual incidents. Financial Literacy Australia provides Incidents reporting and wellbeing check-ins for remote staff.',
    videoUrl: 'https://www.youtube.com/embed/cLZj_BRrJug?worksafe=vic',
    durationMinutes: 3,
    transcript:
      'Employers must identify situations where workers may face violence or aggression and put controls in place — such as training, reporting pathways, and safe work procedures. Workers should report near misses and incidents. Financial Literacy Australia provides Incidents reporting and wellbeing check-ins for remote staff. Use category Near miss when no one was hurt but risk was present.',
  },
]

export type TrainingModuleSeed = {
  slug: string
  title: string
  summary: string
  content: string
  contentBlocks?: TrainingContentBlock[]
  sortOrder: number
  moduleType?: 'training' | 'policy_procedure'
  version?: number
  estimatedMinutes?: number
  requiredForRoles?: ('staff' | 'contractor' | 'manager')[]
  requiresScenarioGate?: boolean
  linkedFormVersion?: string
  quizDefinition?: TrainingQuizDefinition
}

export const WHS_INDUCTION_SEED: TrainingModuleSeed = {
  slug: 'whs-induction',
  title: 'Workplace health and safety induction',
  summary:
    'Safety at home for Financial Literacy Australia contractors — hazards, reporting, and your duties under Victorian law.',
  content:
    'Financial Literacy Australia workplace health and safety induction for remote contractors working on Monash 51358 co-design.',
  sortOrder: 1,
  version: 8,
  requiredForRoles: ['staff', 'contractor', 'manager'],
  contentBlocks: [
    {
      id: 'welcome',
      type: 'text',
      title: 'Welcome — what this means for you',
      body: `You work from home for Financial Literacy Australia as a contractor or staff member on the Monash 51358 co-design project.

Workplace health and safety (WHS) still applies when you work remotely. We must identify hazards, consult with you, and give you clear information. You must take reasonable care for your own safety and follow agreed controls.

Look around your work area now. Is your chair stable? Is the path to the door clear? Can you reach your phone quickly?

Victoria's OHS laws apply to us even though we are not an NDIS provider. Official WorkSafe guidance is on the [/training](/training) hub as short videos with transcripts. This module takes about nine to twelve minutes across short screens — one at a time.`,
    },
    {
      id: 'welcome-check',
      type: 'quiz',
      title: 'Quick check',
      quiz: {
        id: 'whs-responsible',
        prompt: 'Who is responsible for your safety when you work from home for Financial Literacy Australia?',
        options: [
          { id: 'a', label: 'Both you and us — we share responsibility', correct: true },
          { id: 'b', label: 'Only us — you are a contractor so it is not your job', correct: false },
          { id: 'c', label: 'Only you — we cannot control your home', correct: false },
        ],
      },
    },
    {
      id: 'hazards',
      type: 'text',
      title: 'Hazards in your home office',
      body: `Remote work still has physical and psychosocial hazards — trip risks, poor posture, eye strain, fatigue, and isolation.

We expect you to set up a safe space before sessions. You do not need a perfect desk — but you do need to notice risks and fix what you can.

For workstation setup detail, watch the hub clip: [Setting up your home office safely](#video-hazards-video). Report ongoing pain as **Injury** and equipment damage as **Property damage** via Incidents.`,
    },
    {
      id: 'psychosocial-intro',
      type: 'text',
      title: 'Psychosocial hazards — WorkSafe videos',
      body: `Remote work still has psychosocial risks: bullying, fatigue, gendered violence, and aggression.

Watch the **WorkSafe videos** section on the Training page (/training). Each video has a transcript — open it if you need captions or a text summary.

**Deep links** (open from Training hub):
• [Home office setup](#video-hazards-video) — injury and property damage risk
• [Workplace bullying](#video-bullying) — psychosocial
• [Gendered violence](#video-gendered-violence) — psychosocial
• [Aggression at work](#video-aggression) — psychosocial
• [Fatigue](#video-fatigue) — psychosocial
• [Violence risk management](#video-violence-risk) — near miss and psychosocial

You do not need to finish every video in one sitting. Aim to watch at least four before your first co-design session — they link to the incident categories you will use when reporting.`,
    },
    {
      id: 'category-guide',
      type: 'text',
      title: 'Incident categories — match the Staff Hub form',
      body: `When you report via **Incidents**, choose one of five categories (there is no separate "hazard" option):

**Injury** — you or someone else was hurt (e.g. sprained wrist after tripping on a rug during a call).

**Near miss** — something almost went wrong but no injury (e.g. laptop nearly fell; aggressive comment on a call that you de-escalated).

**Property damage** — equipment or property was damaged (e.g. monitor knocked over).

**Psychosocial** — stress, bullying, fatigue, isolation, or feeling unsafe (e.g. repeated harsh comments in a team channel).

**Other** — safety concern that does not fit above (e.g. unsure how to classify — we will help).

If unsure, pick the closest match and email mentors@flaus.com.au.`,
    },
    {
      id: 'hazards-checklist',
      type: 'checklist',
      title: 'Tick what you checked this week',
      body: 'Select each item you have looked at in the last seven days.',
      checklist: [
        { id: 'cords', label: 'Cords and walkways are clear' },
        { id: 'chair', label: 'Chair and screen are at a comfortable height' },
        { id: 'light', label: 'Lighting is adequate — no harsh glare' },
        { id: 'breaks', label: 'I take regular breaks away from the screen' },
        { id: 'phone', label: 'Phone is reachable for emergencies' },
      ],
    },
    {
      id: 'hazards-attest',
      type: 'attestation',
      attestationLabel:
        'I will keep checking my work area and tell us about hazards I cannot fix myself',
    },
    {
      id: 'reporting',
      type: 'text',
      title: 'See something unsafe? Report it',
      body: `Report injuries, near misses, and psychosocial concerns through **Incidents** in Staff Hub as soon as practicable.

The form has three steps — same as the Incident Reporting Procedure policy:

**Step 1:** When, where, and **category** (injury / near miss / property damage / psychosocial / other).

**Step 2:** What happened, immediate actions, optional witnesses, and tick the **PII acknowledgement** (do not include participant names or NDIS numbers unless necessary).

**Step 3:** Severity (low / medium / high), whether treatment was required, then submit.

Email mentors@flaus.com.au if you need help choosing a category.`,
    },
    {
      id: 'reporting-scenario',
      type: 'quiz',
      title: 'Scenario — injury',
      quiz: {
        id: 'whs-report-injury',
        prompt: 'You trip on a loose rug during a co-design call and hurt your wrist. What category and first action?',
        options: [
          {
            id: 'a',
            label: 'Category Injury — get medical help if needed, then report via Incidents within 24 hours',
            correct: true,
          },
          { id: 'b', label: 'Category Near miss — finish the session first', correct: false },
          { id: 'c', label: 'No report needed — it happened at home', correct: false },
        ],
      },
    },
    {
      id: 'reporting-scenario-2',
      type: 'quiz',
      title: 'Scenario — psychosocial',
      quiz: {
        id: 'whs-report-psych',
        prompt:
          'A colleague repeatedly mocks your facilitation style in a team chat. You feel stressed and dread logging on. What do you do?',
        options: [
          {
            id: 'a',
            label: 'Report via Incidents as Psychosocial — and seek support from mentors@flaus.com.au',
            correct: true,
          },
          { id: 'b', label: 'Ignore it — not a physical injury so it does not count', correct: false },
          { id: 'c', label: 'Reply in the chat to defend yourself publicly', correct: false },
        ],
      },
    },
    {
      id: 'emergencies',
      type: 'text',
      title: 'Emergencies — 000 first',
      body: `In a life-threatening emergency, call **000** first.

Then notify us within 24 hours:
• Use Incidents in Staff Hub, or
• Email mentors@flaus.com.au

Save these numbers where you can reach them quickly:
• Emergency: 000
• Mentors: mentors@flaus.com.au

If you work alone at home, tell someone your schedule on session days.`,
    },
    {
      id: 'emergencies-attest',
      type: 'attestation',
      attestationLabel: 'I know to call 000 in an emergency and notify us within 24 hours',
    },
    {
      id: 'consultation',
      type: 'text',
      title: 'Consultation — your voice matters',
      body: `Under Victoria's OHS Act, employers must consult with workers about health and safety.

**What we do:** wellbeing check-ins, training updates, and asking for your input when work changes (new tools, longer session days, new risks).

**What you do:** reply to check-ins when you can, raise concerns early, and take part in safety discussions.

Consultation is not optional politeness — it is how we identify psychosocial risks in remote work. If something affects your safety, tell us before it becomes an incident.`,
    },
    {
      id: 'duties',
      type: 'text',
      title: 'Employer and worker duties',
      body: `**Employer duties (OHS Act section 21)** — Financial Literacy Australia must, so far as reasonably practicable:
• Provide a safe working environment
• Provide information, instruction, and training
• Monitor worker health and conditions
• Consult with workers on safety

**Your duties as a worker (section 25):**
• Take reasonable care for your own health and safety
• Take reasonable care that your actions do not harm others
• Cooperate with our safety policies and check-ins
• Report incidents and hazards promptly

We check in with remote workers about wellbeing and workload. Reply when you can — it helps us meet our duty to consult with you.

More detail: worksafe.vic.gov.au`,
    },
    {
      id: 'duties-final',
      type: 'attestation',
      attestationLabel:
        'I understand my WHS duties and will cooperate with our check-ins and reporting',
    },
  ],
}

export const WHS_REMOTE_WORK_SEED: TrainingModuleSeed = {
  slug: 'whs-remote-work',
  title: 'Working safely from home',
  summary:
    'Eight-point self-check for remote and isolated work — desk, breaks, check-ins, and wellbeing.',
  content:
    'Remote work safety for Financial Literacy Australia contractors — adapted from WorkSafe Victoria WFH guidance.',
  sortOrder: 2,
  version: 5,
  estimatedMinutes: 8,
  requiredForRoles: ['staff', 'contractor', 'manager'],
  contentBlocks: [
    {
      id: 'intro',
      type: 'text',
      title: 'What this means for you',
      body: `Most of our work is remote — co-design sessions from home, solo prep, and team calls.

Remote and isolated work brings psychosocial hazards: stress, long hours alone, and blurred work-home boundaries. Financial Literacy Australia and you both have duties under Victorian OHS law.

This module uses an eight-point self-check adapted from the WorkSafe Victoria working-from-home checklist.`,
    },
    {
      id: 'checklist',
      type: 'checklist',
      title: 'Eight-point self-check',
      body: 'Tick each area you have set up or checked recently.',
      checklist: [
        { id: 'desk', label: 'Desk and chair support good posture for 2+ hour sessions' },
        { id: 'light', label: 'Screen lighting is comfortable — no squinting' },
        { id: 'breaks', label: 'I plan breaks every hour during long session days' },
        { id: 'smoke', label: 'Work area is smoke-free and well ventilated' },
        { id: 'exit', label: 'Exit path is clear if I need to leave quickly' },
        { id: 'checkins', label: 'I respond to wellbeing check-ins from Financial Literacy Australia' },
        { id: 'it', label: 'Device is secure — screen lock when I step away' },
        { id: 'wellbeing', label: 'I notice signs of stress and take action (break, ask for help)' },
      ],
    },
    {
      id: 'full-checklist',
      type: 'resource',
      title: 'Full WorkSafe checklist',
      body: 'For a detailed self-audit, use the official WorkSafe Victoria PDF.',
      resourceUrl:
        'https://content-v2.api.worksafe.vic.gov.au/sites/default/files/2024-12/Working-from-home-safety-wellbeing-checklist-2024-12.pdf',
      resourceTitle: 'Working from home safety and wellbeing checklist',
      resourceKind: 'pdf',
      downloadable: true,
      attribution: 'WorkSafe Victoria, Dec 2024',
    },
    {
      id: 'psychosocial-toolkit',
      type: 'resource',
      title: 'Psychosocial hazards and isolated work',
      body: `Working alone from home can increase isolation — a psychosocial hazard under Victorian law.

**Signs to watch for:** dreading log-on, no one to debrief with after hard sessions, working through breaks, feeling "always on".

**What helps:** scheduled breaks, telling someone your session plan, using mentors@flaus.com.au for support, and reporting sustained stress via Incidents (category **Psychosocial**).

The WorkWell toolkit below has employer and worker actions for remote and isolated work.`,
      resourceUrl: 'https://www.worksafe.vic.gov.au/workwell-toolkit-remote-or-isolated-work',
      resourceTitle: 'WorkWell toolkit — remote or isolated work',
      resourceKind: 'link',
      attribution: 'WorkSafe Victoria',
    },
    {
      id: 'scenario',
      type: 'quiz',
      title: 'Scenario — long screen time',
      quiz: {
        id: 'remote-break',
        prompt: 'You have been at your screen for four hours without a break. What do you do?',
        options: [
          { id: 'a', label: 'Take a 10-minute break now — stand, stretch, hydrate', correct: true },
          { id: 'b', label: 'Push through — the participant is waiting', correct: false },
          { id: 'c', label: 'Skip meals to finish faster', correct: false },
        ],
      },
    },
    {
      id: 'scenario-isolation',
      type: 'quiz',
      title: 'Scenario — working alone',
      quiz: {
        id: 'remote-isolation',
        prompt:
          'After three solo session days you feel isolated and dread logging on. What is the best first step?',
        options: [
          {
            id: 'a',
            label: 'Tell someone your session plan, take breaks, and email mentors@flaus.com.au if it continues',
            correct: true,
          },
          { id: 'b', label: 'Work through it — isolation is not a safety issue', correct: false },
          { id: 'c', label: 'Cancel all sessions without telling us', correct: false },
        ],
      },
    },
    {
      id: 'scenario-boundaries',
      type: 'quiz',
      title: 'Scenario — blurred boundaries',
      quiz: {
        id: 'remote-boundaries',
        prompt:
          'You keep checking emails after hours because co-design feels "always on". What helps most?',
        options: [
          {
            id: 'a',
            label: 'Set a finish time, close work apps, and report sustained stress via Incidents if needed',
            correct: true,
          },
          { id: 'b', label: 'Stay available 24/7 so participants never wait', correct: false },
          { id: 'c', label: 'Ignore it — home and work are the same place', correct: false },
        ],
      },
    },
    {
      id: 'deep-dives',
      type: 'text',
      title: 'WHS deep dives',
      body: `For more detail on psychosocial hazards, fatigue, aggression, ergonomics, working alone, and your consultation rights, complete the **WHS deep dives** modules on the Training page after this module.

They link to the same WorkSafe hub videos — each module focuses on one topic for facilitators.`,
    },
    {
      id: 'attest',
      type: 'attestation',
      attestationLabel:
        'I will follow the eight-point check and tell us if my setup creates a hazard I cannot fix',
    },
  ],
}

export const WHS_PSYCHOSOCIAL_DEEP_DIVE_SEED: TrainingModuleSeed = {
  slug: 'whs-psychosocial-deep-dive',
  title: 'Psychosocial hazards at work',
  summary:
    'Bullying, fatigue, violence, and isolation — how they map to Incidents and WorkSafe hub videos.',
  content: 'Deep dive on psychosocial hazards for Financial Literacy Australia remote facilitators.',
  sortOrder: 3,
  version: 1,
  estimatedMinutes: 8,
  requiredForRoles: ['staff', 'contractor', 'manager'],
  contentBlocks: [
    {
      id: 'intro',
      type: 'text',
      title: 'What psychosocial hazards mean for you',
      body: `Psychosocial hazards affect mental health and wellbeing — not just physical injury.

For Financial Literacy Australia facilitators working from home, common risks include bullying in team channels, fatigue from long session days, gendered violence or harassment on calls, aggression from participants, and isolation when working alone.

Victorian OHS law requires us to identify and manage these risks. You must report concerns via **Incidents** (category **Psychosocial**) or email mentors@flaus.com.au.`,
    },
    {
      id: 'types',
      type: 'text',
      title: 'Types you may see',
      body: `**Bullying** — repeated unreasonable behaviour that creates a risk to health and safety.

**Fatigue** — extreme tiredness affecting concentration and reactions.

**Gendered violence** — behaviour directed at someone because of gender, orientation, or sex characteristics.

**Aggression or violence** — threats, assault, or hostile behaviour on a call or in chat.

**Isolation** — working alone with no debrief after difficult sessions.

Watch the matching WorkSafe clips on [/training](/training) — use the hub accordion, not duplicate embeds here.`,
    },
    {
      id: 'hub-links',
      type: 'text',
      title: 'Hub video deep links',
      body: `Open these from the Training hub **WorkSafe videos** section:

• [Workplace bullying](#video-bullying)
• [Gendered violence](#video-gendered-violence)
• [Aggression at work](#video-aggression)
• [Fatigue](#video-fatigue)
• [Violence risk management](#video-violence-risk)

Aim to watch at least four before your first live co-design session.`,
    },
    {
      id: 'reporting',
      type: 'text',
      title: 'Reporting psychosocial concerns',
      body: `Use **Incidents** in Staff Hub. Choose **Psychosocial** when stress, bullying, harassment, fatigue, or feeling unsafe is the main issue.

Choose **Injury** if someone was physically hurt. Choose **Near miss** if something almost went wrong but no harm occurred.

Email mentors@flaus.com.au if you need help choosing a category or want support after a difficult session.`,
    },
    {
      id: 'scenario',
      type: 'quiz',
      title: 'Scenario',
      quiz: {
        id: 'psych-deep-scenario',
        prompt: 'Repeated harsh comments about your facilitation in a team chat make you dread work. Best action?',
        options: [
          {
            id: 'a',
            label: 'Report via Incidents as Psychosocial and seek support from mentors@flaus.com.au',
            correct: true,
          },
          { id: 'b', label: 'Ignore it — not a physical injury', correct: false },
          { id: 'c', label: 'Reply publicly to defend yourself', correct: false },
        ],
      },
    },
    {
      id: 'attest',
      type: 'attestation',
      attestationLabel: 'I understand psychosocial hazards and will report concerns promptly',
    },
  ],
}

export const WHS_FATIGUE_AND_WORKLOAD_SEED: TrainingModuleSeed = {
  slug: 'whs-fatigue-and-workload',
  title: 'Fatigue and workload',
  summary: 'Session-day pacing, break plans, and when to report workload that affects your safety.',
  content: 'Fatigue and workload guidance for Financial Literacy Australia facilitators.',
  sortOrder: 4,
  version: 1,
  estimatedMinutes: 6,
  requiredForRoles: ['staff', 'contractor', 'manager'],
  contentBlocks: [
    {
      id: 'intro',
      type: 'text',
      title: 'Fatigue on session days',
      body: `Long remote session days — back-to-back co-design calls, solo prep, and admin — increase fatigue risk.

Fatigue is more than being tired. Signs include difficulty concentrating, irritability, slower reactions, and dreading log-on.

Financial Literacy Australia expects you to plan breaks and tell us if workload affects your safety.`,
    },
    {
      id: 'hub-link',
      type: 'text',
      title: 'WorkSafe fatigue clip',
      body: `Watch the hub video: [Fatigue in the workplace](#video-fatigue).

Take regular breaks, maintain sleep routines, and plan at least a short break every hour on long session days.`,
    },
    {
      id: 'pacing',
      type: 'text',
      title: 'Pacing your day',
      body: `**Before session days:** block breaks in your calendar, hydrate, and tell someone your schedule.

**During sessions:** offer participants breaks when they look tired — you need breaks too.

**After hard sessions:** debrief with mentors@flaus.com.au if needed — do not carry stress alone.

Sustained fatigue that affects safety is reportable via Incidents (**Psychosocial**).`,
    },
    {
      id: 'scenario',
      type: 'quiz',
      title: 'Scenario',
      quiz: {
        id: 'fatigue-scenario',
        prompt: 'You have four sessions booked back-to-back with no breaks. What do you do?',
        options: [
          {
            id: 'a',
            label: 'Reschedule or insert breaks — and tell us if the roster is unsustainable',
            correct: true,
          },
          { id: 'b', label: 'Push through — participants are waiting', correct: false },
          { id: 'c', label: 'Skip lunch to keep the schedule', correct: false },
        ],
      },
    },
    {
      id: 'attest',
      type: 'attestation',
      attestationLabel: 'I will plan breaks on session days and report unsustainable workload',
    },
  ],
}

export const WHS_AGGRESSION_AND_VIOLENCE_SEED: TrainingModuleSeed = {
  slug: 'whs-aggression-and-violence',
  title: 'Aggression and violence',
  summary: 'De-escalation, stopping a session, and reporting threats on calls or in chat.',
  content: 'Aggression and violence guidance for Financial Literacy Australia facilitators.',
  sortOrder: 5,
  version: 1,
  estimatedMinutes: 6,
  requiredForRoles: ['staff', 'contractor', 'manager'],
  contentBlocks: [
    {
      id: 'intro',
      type: 'text',
      title: 'When calls feel unsafe',
      body: `Remote facilitators may face aggression from participants, colleagues, or others on video calls or in messages.

Workplace violence includes threats, assault, and aggressive behaviour. You can pause or stop a session if you feel unsafe.

Financial Literacy Australia must manage these risks — you help by reporting incidents and near misses.`,
    },
    {
      id: 'hub-links',
      type: 'text',
      title: 'WorkSafe hub clips',
      body: `Watch on [/training](/training):

• [Aggression or violence in the workplace](#video-aggression)
• [Managing the risk of violence and aggression](#video-violence-risk)

Report **near misses** when something almost went wrong but no one was hurt.`,
    },
    {
      id: 'de-escalation',
      type: 'text',
      title: 'De-escalation and stopping',
      body: `**Stay calm.** Lower your voice. Do not match aggression.

**Set boundaries:** "I need us to speak respectfully to continue."

**Stop if needed:** "We can pause here." End the call if you feel at risk.

**Report:** Incidents category **Psychosocial** or **Injury** if harmed. Call **000** if in immediate danger.`,
    },
    {
      id: 'scenario',
      type: 'quiz',
      title: 'Scenario',
      quiz: {
        id: 'aggression-scenario',
        prompt: 'A participant shouts threats during a co-design call. What do you do first?',
        options: [
          { id: 'a', label: 'End the session safely, then report via Incidents', correct: true },
          { id: 'b', label: 'Keep going so the data is complete', correct: false },
          { id: 'c', label: 'Shout back to assert control', correct: false },
        ],
      },
    },
    {
      id: 'attest',
      type: 'attestation',
      attestationLabel: 'I will stop unsafe sessions and report aggression or violence',
    },
  ],
}

export const WHS_HOME_ERGONOMICS_SEED: TrainingModuleSeed = {
  slug: 'whs-home-ergonomics',
  title: 'Home office ergonomics',
  summary: 'Desk, chair, and screen setup — injury vs property damage when things go wrong.',
  content: 'Home office ergonomics for Financial Literacy Australia remote workers.',
  sortOrder: 6,
  version: 1,
  estimatedMinutes: 6,
  requiredForRoles: ['staff', 'contractor', 'manager'],
  contentBlocks: [
    {
      id: 'intro',
      type: 'text',
      title: 'Why setup matters',
      body: `Poor workstation setup causes injury over time — wrist pain, neck strain, and eye fatigue.

You do not need expensive furniture. You do need a stable chair, screen at comfortable height, and clear walkways.

Financial Literacy Australia expects you to check your setup before long session blocks.`,
    },
    {
      id: 'hub-link',
      type: 'text',
      title: 'WorkSafe home office clip',
      body: `Watch: [Setting up your home office safely](#video-hazards-video) on the Training hub.

The transcript covers monitor height, chair position, keyboard placement, and taking breaks from sitting.`,
    },
    {
      id: 'checklist',
      type: 'checklist',
      title: 'Quick ergonomics check',
      checklist: [
        { id: 'screen', label: 'Screen at eye level — about an arm\'s length away' },
        { id: 'feet', label: 'Feet flat on floor or on a footrest' },
        { id: 'keyboard', label: 'Keyboard and mouse at elbow height' },
        { id: 'light', label: 'No harsh glare on the screen' },
        { id: 'walk', label: 'Walkways clear — no trip hazards' },
      ],
    },
    {
      id: 'incidents',
      type: 'text',
      title: 'Injury vs property damage',
      body: `**Injury** — ongoing pain from poor setup (e.g. wrist strain after long sessions). Report via Incidents.

**Property damage** — equipment damaged (e.g. monitor knocked over). Report via Incidents.

**Near miss** — chair wheel caught on rug but you did not fall. Report via Incidents.

For the full WorkSafe PDF checklist, see **Working safely from home**.`,
    },
    {
      id: 'attest',
      type: 'attestation',
      attestationLabel: 'I will maintain a safe workstation and report pain or damage',
    },
  ],
}

export const WHS_WORKING_ALONE_SEED: TrainingModuleSeed = {
  slug: 'whs-working-alone',
  title: 'Working alone and emergencies',
  summary: 'Check-ins, 000, and lone-worker expectations for home-based facilitators.',
  content: 'Working alone and emergency procedures for Financial Literacy Australia staff.',
  sortOrder: 7,
  version: 1,
  estimatedMinutes: 5,
  requiredForRoles: ['staff', 'contractor', 'manager'],
  contentBlocks: [
    {
      id: 'intro',
      type: 'text',
      title: 'Working alone at home',
      body: `Most co-design work happens alone at home. Isolation is a psychosocial hazard — but emergencies can happen too.

Tell someone your schedule on session days. Keep your phone within reach. Know your exit path if you need to leave quickly.`,
    },
    {
      id: 'checkins',
      type: 'text',
      title: 'Check-ins and wellbeing',
      body: `We send wellbeing check-ins — reply when you can. This is part of consultation under Victorian OHS law.

If you feel unwell, unsafe, or unable to continue a session, you may pause or stop. Contact mentors@flaus.com.au for debrief support.`,
    },
    {
      id: 'emergencies',
      type: 'text',
      title: 'Emergencies — 000 first',
      body: `In a life-threatening emergency, call **000** first.

Then notify us within 24 hours via Incidents or mentors@flaus.com.au.

Save **000** and **mentors@flaus.com.au** where you can reach them quickly during sessions.`,
    },
    {
      id: 'scenario',
      type: 'quiz',
      title: 'Scenario',
      quiz: {
        id: 'alone-emergency',
        prompt: 'You feel chest pain during a solo session. What do you do?',
        options: [
          { id: 'a', label: 'Call 000, end the session, notify us within 24 hours', correct: true },
          { id: 'b', label: 'Finish the session first — only a few questions left', correct: false },
          { id: 'c', label: 'No report needed — it happened at home', correct: false },
        ],
      },
    },
    {
      id: 'attest',
      type: 'attestation',
      attestationLabel: 'I know to call 000 in an emergency and notify us within 24 hours',
    },
  ],
}

export const WHS_CONSULTATION_AND_RIGHTS_SEED: TrainingModuleSeed = {
  slug: 'whs-consultation-and-rights',
  title: 'Consultation and your rights',
  summary: 'Victorian employer and worker duties — how we consult on safety when you work remotely.',
  content: 'Consultation and worker rights under Victorian OHS law for Financial Literacy Australia.',
  sortOrder: 8,
  version: 1,
  estimatedMinutes: 6,
  requiredForRoles: ['staff', 'contractor', 'manager'],
  contentBlocks: [
    {
      id: 'intro',
      type: 'text',
      title: 'Your voice in safety',
      body: `Under Victoria's OHS Act, employers must consult with workers about health and safety.

Consultation is not optional politeness — it is how we identify psychosocial risks in remote work.

If something affects your safety, tell us before it becomes an incident.`,
    },
    {
      id: 'duties',
      type: 'text',
      title: 'Employer and worker duties',
      body: `**Employer duties (section 21)** — Financial Literacy Australia must, so far as reasonably practicable:
• Provide a safe working environment
• Provide information, instruction, and training
• Monitor conditions and consult with workers

**Your duties (section 25):**
• Take reasonable care for your own health and safety
• Take reasonable care that your actions do not harm others
• Cooperate with safety policies and check-ins
• Report incidents and hazards promptly`,
    },
    {
      id: 'consultation',
      type: 'text',
      title: 'How we consult',
      body: `**What we do:** wellbeing check-ins, training updates, and asking for input when work changes.

**What you do:** reply to check-ins when you can, raise concerns early, and take part in safety discussions.

More detail: worksafe.vic.gov.au`,
    },
    {
      id: 'scenario',
      type: 'quiz',
      title: 'Scenario',
      quiz: {
        id: 'consultation-scenario',
        prompt: 'We introduce a new tool that adds two hours of prep per session. You feel overloaded. What do you do?',
        options: [
          {
            id: 'a',
            label: 'Raise it early with mentors@flaus.com.au — consultation before harm occurs',
            correct: true,
          },
          { id: 'b', label: 'Say nothing — consultation is only for physical hazards', correct: false },
          { id: 'c', label: 'Quit without telling us why', correct: false },
        ],
      },
    },
    {
      id: 'attest',
      type: 'attestation',
      attestationLabel: 'I understand my rights to consultation and will raise safety concerns early',
    },
  ],
}

export const PRIVACY_BASICS_STAFF_SEED: TrainingModuleSeed = {
  slug: 'privacy-basics-staff',
  title: 'Your privacy and where data is stored',
  summary: 'Your payroll data vs Monash session data — Singapore storage and what never goes in quotes.',
  content: 'Privacy basics for all Financial Literacy Australia staff and contractors.',
  sortOrder: 9,
  version: 5,
  requiredForRoles: ['staff', 'contractor', 'manager'],
  contentBlocks: [
    {
      id: 'intro',
      type: 'text',
      title: 'What this means for you',
      body: `Financial Literacy Australia handles two different kinds of personal information about you:

**Your payroll and HR data** — name, bank details, tax file number, contact details. Used to pay you and meet employment obligations.

**Participant session data** — observations and quotes from Monash 51358 co-design sessions. This is research data, not about you.

Keep these separate in your mind. Facilitator training covers the session form — this module covers your own privacy and storage.`,
    },
    {
      id: 'storage',
      type: 'text',
      title: 'Where data is stored',
      body: `Staff Hub production data may be processed on servers in **Singapore** (Render). You were told at login.

Participant information you enter in Session Capture may also be stored outside Australia. Facilitators read a privacy script aloud so participants hear this before they share anything.

We are the data custodian for Monash 51358. Privacy contact: mentors@flaus.com.au`,
    },
    {
      id: 'quotes',
      type: 'text',
      title: 'What never goes in session quotes',
      body: `Even if you are not facilitating yet, know these rules:

• Do not put participant full names in quote fields
• Do not put NDIS numbers in notes
• Do not copy emails, phone numbers, or names from the contact-details fields into quotes or facilitator notes
• Use the participant's exact words — do not add extra identifiers

More: OAIC employee privacy guide at oaic.gov.au/privacy/your-responsibilities`,
    },
    {
      id: 'quiz',
      type: 'quiz',
      title: 'Quick check — contact details',
      body: 'Session Capture has a separate area for contact details (email, phone, name). Only fill it in when the participant agrees to be contacted.',
      quiz: {
        id: 'privacy-separate',
        prompt: 'A participant gives you their email during a session. Where should it go?',
        options: [
          {
            id: 'a',
            label: 'Only in the contact-details fields — if they agreed to be contacted',
            correct: true,
          },
          { id: 'b', label: 'In the quote field so we remember it', correct: false },
          { id: 'c', label: 'In my personal notes app', correct: false },
        ],
      },
    },
    {
      id: 'quiz-storage',
      type: 'quiz',
      title: 'Quick check — your data vs session data',
      quiz: {
        id: 'privacy-payroll-vs-session',
        prompt: 'Which statement is correct about data stored in Singapore?',
        options: [
          {
            id: 'a',
            label: 'Staff Hub may process your payroll data and participant session data on servers outside Australia',
            correct: true,
          },
          {
            id: 'b',
            label: 'Only participant session data leaves Australia — payroll always stays in Australia',
            correct: false,
          },
          { id: 'c', label: 'Singapore storage applies only to managers, not contractors', correct: false },
        ],
      },
    },
    {
      id: 'attest',
      type: 'attestation',
      attestationLabel: 'I understand Singapore storage, data classes, and will direct privacy questions to mentors@flaus.com.au',
    },
  ],
}

export const POLICY_SEEDS: TrainingModuleSeed[] = [
  {
    slug: 'code-of-conduct',
    title: 'Code of conduct',
    summary: 'How we work — remote professionalism, confidentiality, and co-design respect.',
    sortOrder: 1,
    moduleType: 'policy_procedure',
    version: 4,
    requiredForRoles: ['staff', 'contractor', 'manager'],
    content: 'Code of Conduct for remote staff and contractors at Financial Literacy Australia.',
    contentBlocks: [
      {
        id: 'intro',
        type: 'text',
        title: 'What this means for you',
        body: `This code applies to everyone working for Financial Literacy Australia — staff, contractors, and managers — including remote work on Monash 51358.

We expect you to act with integrity, respect participants and colleagues, and protect confidential information.`,
      },
      {
        id: 'remote',
        type: 'text',
        title: 'Remote work and professionalism',
        body: `• Be on time for sessions and meetings
• Use a private, quiet space for co-design calls
• Lock your device when you step away
• Dress appropriately for video calls with participants
• Do not record sessions unless we explicitly approve it`,
      },
      {
        id: 'confidentiality',
        type: 'text',
        title: 'Confidentiality and co-design behaviour',
        body: `• Do not share participant data outside Staff Hub
• Do not discuss session content on personal social media
• Follow the golden rule in co-design training — do not teach participants
• Report conflicts of interest to Daniel Ross or mentors@flaus.com.au
• Treat participants with dignity — many have disability; go at their pace`,
      },
      {
        id: 'scenario-confidentiality',
        type: 'quiz',
        title: 'Scenario — confidentiality',
        quiz: {
          id: 'coc-confidentiality',
          prompt:
            'A friend asks what a participant said in today\'s co-design session. What do you do?',
          options: [
            {
              id: 'a',
              label: 'Decline — session content stays in Staff Hub only',
              correct: true,
            },
            { id: 'b', label: 'Share a general summary without names', correct: false },
            { id: 'c', label: 'Post an anonymised quote on social media', correct: false },
          ],
        },
      },
      {
        id: 'scenario-respect',
        type: 'quiz',
        title: 'Scenario — participant respect',
        quiz: {
          id: 'coc-respect',
          prompt: 'A participant is slow to navigate and you are running behind schedule. What do you do?',
          options: [
            { id: 'a', label: 'Go at their pace — do not rush or teach', correct: true },
            { id: 'b', label: 'Take over the mouse to speed things up', correct: false },
            { id: 'c', label: 'Skip sections so you finish on time', correct: false },
          ],
        },
      },
      {
        id: 'attest',
        type: 'attestation',
        attestationLabel: 'I have read the Code of Conduct and will follow it in my work for Financial Literacy Australia',
      },
    ],
  },
  {
    slug: 'privacy-data-handling',
    title: 'Privacy and data handling',
    summary: 'How we handle Monash 51358 data — classes, Section 8 separation, and breach reporting.',
    sortOrder: 2,
    moduleType: 'policy_procedure',
    version: 4,
    requiredForRoles: ['staff', 'contractor', 'manager'],
    content: 'Privacy and data handling policy aligned with docs/data-handling-and-privacy.md.',
    contentBlocks: [
      {
        id: 'intro',
        type: 'text',
        title: 'What this means for you',
        body: `Financial Literacy Australia is data custodian for Monash 51358 co-design. We are not a registered NDIS provider.

You may handle participant research data, verbatim quotes, facilitator notes, and (in limited cases) Section 8 contact details. Each class has different rules and retention.`,
      },
      {
        id: 'classes',
        type: 'text',
        title: 'Data classes (plain language)',
        body: `**Session research (A)** — Sections 1–7 observations and ratings. Stored in survey responses. Retained for project + 12 months, then export and delete.

**Verbatim quotes (B)** — Exact participant words in Section 9. Same storage as A.

**Facilitator notes (C)** — Problems and severity after the participant leaves. Same storage as A.

**Section 8 contact (D)** — Name, phone, email. Stored separately in session-contact-details. Never copy into quotes.

**Practice captures (E)** — Fake training sessions. Auto-deleted after 30 days.

**Training evidence (F)** — Your quiz answers and attestations. Kept 7 years.`,
      },
      {
        id: 'rules',
        type: 'text',
        title: 'Facilitator rules',
        body: `1. Read Section 7 word-for-word every session
2. Section 8 only if participant said Yes in Section 7
3. Never copy contact details into quotes or notes
4. Use exact words in quotes — no extra names or NDIS numbers
5. Complete Section 9 notes after the participant leaves
6. Work from a private screen; lock your device
7. Report data problems within 24 hours to mentors@flaus.com.au
8. Direct participant privacy questions to mentors@flaus.com.au

Cross-border: data may be processed in Singapore (APP 8). Disclosed in Section 7 and at staff login.`,
      },
      {
        id: 'capture-walkthrough',
        type: 'text',
        title: 'Session Capture walkthrough',
        body: `**Sections 1–6** — observations and ratings during the session.

**Section 7** — privacy script read aloud (verbatim).

**Section 8** — contact details **only** if they said Yes in Section 7. Stored separately.

**Section 9** — quotes and facilitator notes **after** the participant leaves.

Never copy Section 8 fields into quotes or notes. Use exact words in quote fields.`,
      },
      {
        id: 'scenario-section8',
        type: 'quiz',
        title: 'Scenario — Section 8',
        quiz: {
          id: 'privacy-s8-scenario',
          prompt: 'A participant said No in Section 7 but offers their email anyway. What do you do?',
          options: [
            { id: 'a', label: 'Leave Section 8 blank — do not record contact details', correct: true },
            { id: 'b', label: 'Record email in Section 8 "just in case"', correct: false },
            { id: 'c', label: 'Put email in facilitator notes for follow-up', correct: false },
          ],
        },
      },
      {
        id: 'scenario-quotes',
        type: 'quiz',
        title: 'Scenario — quotes',
        quiz: {
          id: 'privacy-quotes-scenario',
          prompt: 'You want to remember who said a quote. What is the correct approach?',
          options: [
            {
              id: 'a',
              label: 'Use exact words only — no names or NDIS numbers in quote fields',
              correct: true,
            },
            { id: 'b', label: 'Add first name in brackets after the quote', correct: false },
            { id: 'b2', label: 'Copy their NDIS number into facilitator notes', correct: false },
          ],
        },
      },
      {
        id: 'attest',
        type: 'attestation',
        attestationLabel: 'I understand our data classes and will follow handling rules',
      },
    ],
  },
  {
    slug: 'incident-reporting-procedure',
    title: 'Incident reporting procedure',
    summary: 'Three-step incident form — five categories, PII, witnesses, and severity via Staff Hub.',
    sortOrder: 3,
    moduleType: 'policy_procedure',
    version: 5,
    requiredForRoles: ['staff', 'contractor', 'manager'],
    requiresScenarioGate: true,
    content: 'How to report incidents at Financial Literacy Australia using the Staff Hub form.',
    quizDefinition: {
      passScore: 100,
      questions: [
        {
          id: 'incident-scenario-near-miss',
          prompt:
            'During a co-design call your external monitor wobbles and almost falls. No damage or injury. Which category?',
          options: [
            { id: 'a', label: 'Near miss', correct: true },
            { id: 'b', label: 'Injury', correct: false },
            { id: 'c', label: 'Psychosocial', correct: false },
          ],
        },
        {
          id: 'incident-scenario-psychosocial',
          prompt:
            'You feel repeatedly excluded from team planning chats and it is affecting your wellbeing. Best category?',
          options: [
            { id: 'a', label: 'Psychosocial', correct: true },
            { id: 'b', label: 'Other — always use Other when unsure', correct: false },
            { id: 'c', label: 'Property damage', correct: false },
          ],
        },
      ],
    },
    contentBlocks: [
      {
        id: 'intro',
        type: 'text',
        title: 'What this means for you',
        body: `All injuries, near misses, property damage, psychosocial concerns, and other safety issues must be reported as soon as practicable — even when you work from home.

Reporting protects you, colleagues, and participants. We use reports to fix risks and meet Victorian OHS duties.

**Emergency:** If anyone is in immediate danger, call **000** first, then report within 24 hours.`,
      },
      {
        id: 'step-1',
        type: 'text',
        title: 'Step 1 — When, where, category',
        body: `Open **Incidents** in the Staff Hub menu and start a new report.

**When did it happen?** — date and time.

**Where did it happen?** — e.g. home office, video call, shared workspace.

**Category** — choose exactly one:
• **Injury** — someone was hurt
• **Near miss** — almost caused harm but did not
• **Property damage** — equipment or property damaged
• **Psychosocial** — stress, bullying, fatigue, feeling unsafe
• **Other** — does not fit above (we will help classify)

There is no separate "hazard" category — if you spotted a risk before anyone was hurt, use **Near miss**.`,
      },
      {
        id: 'category-tree',
        type: 'text',
        title: 'Category decision tree',
        body: `Use this quick guide:

**Was anyone injured?** → Yes → **Injury** (also tick treatment required on step 3 if applicable).

**Was property damaged?** → Yes → **Property damage**.

**Did something almost go wrong (no injury/damage)?** → **Near miss**.

**Is it about stress, bullying, harassment, fatigue, or feeling unsafe?** → **Psychosocial**.

**Still unsure?** → **Other** and email mentors@flaus.com.au.

Examples:
• Sprained ankle from tripping on a cord → **Injury**
• Laptop nearly fell off desk → **Near miss**
• Cracked monitor screen → **Property damage**
• Hostile messages in team chat → **Psychosocial**`,
      },
      {
        id: 'step-2',
        type: 'text',
        title: 'Step 2 — Description, actions, witnesses, PII',
        body: `**What happened?** — plain language: who, what, where, when.

**Immediate actions taken** — e.g. called 000, moved to safe room, paused session, took a break.

**Witnesses (optional)** — add name, role, and contact for anyone who saw or heard what happened.

**PII acknowledgement (required)** — tick: *I will not include participant names or NDIS numbers unless necessary.*

You cannot continue to step 3 without ticking this box. Keep participant identifiers out of incident descriptions unless essential for safety.`,
      },
      {
        id: 'step-3',
        type: 'text',
        title: 'Step 3 — Severity and submit',
        body: `**Severity:**
• **Low** — minor or no ongoing impact
• **Medium** — needs follow-up or time off work
• **High** — serious injury, threat, or urgent action needed

**Treatment was required** — tick if medical treatment was needed.

Click **Submit report**. A manager will acknowledge and follow up.

Email mentors@flaus.com.au if you need help using the form.`,
      },
      {
        id: 'examples',
        type: 'text',
        title: 'Examples by category',
        body: `**Injury** — wrist pain after long sessions; slip on wet floor during work hours.

**Near miss** — chair wheel caught on rug; participant made a threatening comment you de-escalated.

**Property damage** — phone dropped during a call; power surge damaged laptop.

**Psychosocial** — bullying in team chat; isolation working alone; fatigue from back-to-back session days.

**Other** — data/privacy concern that also needs mentors@flaus.com.au within 24 hours.`,
      },
      {
        id: 'scenario-1',
        type: 'quiz',
        title: 'Scenario — near miss',
        quiz: {
          id: 'incident-scenario-near-miss',
          prompt:
            'During a co-design call your external monitor wobbles and almost falls. No damage or injury. Which category?',
          options: [
            { id: 'a', label: 'Near miss', correct: true },
            { id: 'b', label: 'Injury', correct: false },
            { id: 'c', label: 'Psychosocial', correct: false },
          ],
        },
      },
      {
        id: 'scenario-2',
        type: 'quiz',
        title: 'Scenario — psychosocial',
        quiz: {
          id: 'incident-scenario-psychosocial',
          prompt:
            'You feel repeatedly excluded from team planning chats and it is affecting your wellbeing. Best category?',
          options: [
            { id: 'a', label: 'Psychosocial', correct: true },
            { id: 'b', label: 'Other — always use Other when unsure', correct: false },
            { id: 'c', label: 'Property damage', correct: false },
          ],
        },
      },
      {
        id: 'scenario-3',
        type: 'quiz',
        title: 'Scenario — property damage',
        quiz: {
          id: 'incident-scenario-property',
          prompt:
            'Your external monitor falls off the desk during a call and the screen cracks. No injury. Which category?',
          options: [
            { id: 'a', label: 'Property damage', correct: true },
            { id: 'b', label: 'Near miss — nothing was damaged', correct: false },
            { id: 'c', label: 'Injury — equipment was hurt', correct: false },
          ],
        },
      },
      {
        id: 'attest',
        type: 'attestation',
        attestationLabel:
          'I know how to complete all three steps of the Incidents form and will report promptly',
      },
    ],
  },
]

export function buildCoDesignContentBlocks(
  slug: string,
  baseContent: string,
): TrainingContentBlock[] | undefined {
  switch (slug) {
    case 'codesign-golden-rule':
      return [
        {
          id: 'hook',
          type: 'text',
          title: "Golden rule — don't teach",
          body: `What this means for Financial Literacy Australia: co-design sessions are research, not training.

${baseContent}

If you show participants where to click, we cannot tell what they would have done alone — the Monash 51358 data becomes unusable.`,
        },
        {
          id: 'examples',
          type: 'text',
          title: 'Say this, not that',
          body: `**Say:** "Show me what you would do."

**Not:** "Click here — let me show you."

**Say:** "Take your time — there is no rush."

**Not:** "The answer is on the next screen."

Wait silently when they pause. Teaching feels helpful but breaks the study.`,
        },
        {
          id: 'scenario-check',
          type: 'quiz',
          title: 'Check — stuck participant',
          quiz: {
            id: 'golden-scenario',
            prompt: 'A participant is stuck on a screen. What do you say first?',
            options: [
              { id: 'a', label: '"Show me what you would do."', correct: true },
              { id: 'b', label: '"Let me click that for you."', correct: false },
            ],
          },
        },
        {
          id: 'attest',
          type: 'attestation',
          attestationLabel: 'I will not teach during co-design — I will let participants try',
        },
      ]
    case 'codesign-before-session':
      return [
        {
          id: 'hook',
          type: 'text',
          title: 'Before every session',
          body: `What this means for Financial Literacy Australia: a short checklist stops problems during Monash 51358 co-design calls.

${baseContent}`,
        },
        {
          id: 'checklist',
          type: 'checklist',
          title: 'Pre-session checklist',
          checklist: [
            { id: 'consent', label: 'Consent is signed and on file' },
            { id: 'device', label: 'Participant device is set up and charged' },
            { id: 'space', label: 'Quiet, accessible space confirmed' },
            { id: 'water', label: 'Water and break plan discussed' },
            { id: 'form', label: 'Session Capture form open and ready' },
          ],
        },
        {
          id: 'do-example',
          type: 'text',
          title: 'Do — facilitator example',
          body: `**Good:** You message the participant 15 minutes before: "Hi — I'll call from Teams. Do you have water nearby and a quiet spot?"

**Check:** Consent PDF is in Staff Hub. Device is charged. You have Session Capture open on a private screen.

**Bad:** Starting the call without checking consent or rushing setup because you are late.`,
        },
        {
          id: 'attest',
          type: 'attestation',
          attestationLabel: 'I will complete this checklist before each live session',
        },
      ]
    case 'codesign-welcome-script':
      return [
        {
          id: 'hook',
          type: 'text',
          title: 'Welcome script — read aloud',
          body: 'Say these lines before you begin. Use a calm, friendly tone. **Pause** after each bullet so the participant can absorb it.',
        },
        {
          id: 'script',
          type: 'text',
          title: 'Verbatim script',
          body: baseContent,
        },
        {
          id: 'plain-english',
          type: 'text',
          title: 'What each line means',
          body: `**"Thank you for helping us today."** — Sets a warm, grateful tone. They are volunteering their time.

**"There are no right or wrong answers."** — Reduces performance anxiety. We want honest reactions, not "correct" clicks.

**"You can stop, take a break, or skip any question."** — Confirms their control. If they look tired or uncomfortable later, offer a break — do not push.

**Pause cue:** After the last line, wait five seconds before opening Session Capture. Ask: "Any questions before we start?"`,
        },
        {
          id: 'attest',
          type: 'attestation',
          attestationLabel: 'I will read the welcome script aloud at the start of each session',
        },
      ]
    case 'codesign-during-session':
      return [
        {
          id: 'hook',
          type: 'text',
          title: 'During the session',
          body: `What this means for Financial Literacy Australia: your job is to observe, not teach.

${baseContent}`,
        },
        {
          id: 'wait',
          type: 'text',
          title: 'The 10-second wait rule',
          body: `When a participant pauses, count silently to ten before you speak.

Example: they stare at the screen after a question. Wait. They may be thinking. Jumping in too early ruins the data.

If still stuck after ten seconds, use the golden rule: "Show me what you would do."`,
        },
        {
          id: 'do-check',
          type: 'text',
          title: 'Do / Check — facilitator example',
          body: `**Do:** Read scripts as written. Note their exact words for quotes later.

**Check:** You are not teaching — you are observing. If you feel the urge to click for them, pause.

**Example:** They say "I'd press Pay but I don't trust it." Write that exact sentence in quotes after they leave — do not add their name.`,
        },
        {
          id: 'attest',
          type: 'attestation',
          attestationLabel: 'I will wait 10 seconds before prompting and will not teach',
        },
      ]
    case 'codesign-distress-responses':
      return [
        {
          id: 'hook',
          type: 'text',
          title: 'If someone is confused, tired, upset, or wants to stop',
          body: 'Use the exact scripts below. Do not improvise during live Monash 51358 sessions — participants need consistent, respectful responses.',
        },
        {
          id: 'scenario-confused',
          type: 'text',
          title: 'Confused',
          body: `**Signs:** frowning, long pauses, "I don't understand this screen."

**Say:** "That's really helpful — the fact that it's confusing is exactly what we need to know."

**Do not:** explain the screen or teach them where to click.

**Note:** record their confusion in facilitator notes after they leave.`,
        },
        {
          id: 'scenario-tired',
          type: 'text',
          title: 'Tired',
          body: `**Signs:** yawning, rubbing eyes, slumping, saying they are worn out.

**Say:** "Would you like a break?"

**Do not:** "We only have ten minutes left — keep going."

Offer water, a stretch, or rescheduling. Fatigue is a psychosocial safety issue — report patterns via Incidents if needed.`,
        },
        {
          id: 'scenario-distressed',
          type: 'text',
          title: 'Distressed or upset',
          body: `**Signs:** tearful, anxious, withdrawn, voice shaking.

**Say:** "We can stop here. You've been really helpful."

**Do not:** push for one more question or minimise their feelings.

End the session calmly. Note where you stopped. Contact mentors@flaus.com.au if you need debrief support.`,
        },
        {
          id: 'scenario-stop',
          type: 'text',
          title: 'Wants to stop',
          body: `**Signs:** "I want to finish", "Can we stop?", closing the laptop.

**Say:** Thank them sincerely. Confirm they can leave.

**Do not:** negotiate or guilt them into continuing.

End Session Capture at the point they stopped. Partial data is still valuable.`,
        },
        {
          id: 'attest',
          type: 'attestation',
          attestationLabel: 'I will use these distress scripts and will not push participants who want to stop',
        },
      ]
    case 'codesign-practice-capture':
      return [
        {
          id: 'hook',
          type: 'text',
          title: 'Practice session capture',
          body: `Before your first live Monash 51358 session, complete a **practice** Session Capture in Staff Hub using fake details only.`,
        },
        {
          id: 'steps',
          type: 'text',
          title: 'Step-by-step unlock',
          body: `**1. Complete prerequisite training** — WHS Induction, privacy basics, Section 7, distress responses, and other assigned modules.

**2. Open Practice Capture** — from Training or the Session Capture menu. The form matches live capture but is flagged as practice.

**3. Use fake data only** — invented participant responses, no real names or NDIS numbers.

**4. Submit the practice form** — your answers are checked against the golden rule and Section 7/8 rules.

**5. What happens next** — if you pass, **live session capture unlocks** in the app. If not, you will see which step failed and can retry.

Practice submissions are auto-deleted after 30 days — they are not project data.`,
        },
        {
          id: 'attest',
          type: 'attestation',
          attestationLabel: 'I will complete practice capture with fake data before my first live session',
        },
      ]
    case 'codesign-quotes-notes':
      return [
        {
          id: 'hook',
          type: 'text',
          title: 'Quotes and notes',
          body: 'Complete quote fields and Section 9 facilitator notes after the participant has left.',
        },
        {
          id: 'good-bad',
          type: 'text',
          title: 'Good vs bad quote examples',
          body: `**Good quote:** "I would tap here but I am not sure what happens next."

**Bad quote:** "Sarah (NDIS 123456) said she would tap here."

**Good note:** "Participant hesitated 15 seconds before clicking Pay."

**Bad note:** "John's email is john@example.com — he struggled with Pay."

Never add names, NDIS numbers, or contact details outside Section 8.`,
        },
        {
          id: 'do-check',
          type: 'text',
          title: 'Do / Check — after they leave',
          body: `**Do:** Complete Section 9 only after the participant has left the call.

**Check:** Quote fields contain their words only — no extra identifiers.

**Example:** If they said "This screen scares me", that is the quote. Do not add "Participant 3 from Horsham".`,
        },
        {
          id: 'attest',
          type: 'attestation',
          attestationLabel: 'I will use exact words in quotes and complete notes after the participant leaves',
        },
      ]
    case 'codesign-privacy-basics':
      return [
        {
          id: 'hook',
          type: 'text',
          title: 'What not to put in the form',
          body: `What this means for Financial Literacy Australia: participant privacy is protected by how you write notes.

${baseContent}`,
        },
        {
          id: 'app8',
          type: 'text',
          title: 'Section 8 and overseas storage',
          body: `Section 8 contact details are stored separately — never in quotes.

Data may be stored in Singapore. Read Section 7 word-for-word so participants know this.

Privacy questions: mentors@flaus.com.au`,
        },
        {
          id: 'do-check',
          type: 'text',
          title: 'Do / Check — what belongs in notes',
          body: `**OK in notes:** "Participant confused by jargon on Pay screen."

**Not OK:** Full name, NDIS number, phone, or email copied from Section 8.

**Check:** Before submit, scan every field for accidental identifiers.`,
        },
        {
          id: 'attest',
          type: 'attestation',
          attestationLabel: 'I will keep contact details in Section 8 only and follow APP 8 disclosure',
        },
      ]
    default:
      return undefined
  }
}

export const CO_DESIGN_QUIZ_SECOND_QUESTIONS: Record<string, TrainingQuizDefinition['questions']> = {
  'codesign-golden-rule': [
    {
      id: 'golden-2',
      prompt: 'Why must you avoid teaching during co-design?',
      options: [
        { id: 'a', label: 'We need to see what they would do without help — or the data is unusable', correct: true },
        { id: 'b', label: 'Teaching is faster so we should help when stuck', correct: false },
      ],
    },
  ],
  'codesign-distress-responses': [
    {
      id: 'distress-2',
      prompt: 'A participant says they are tired. What do you say?',
      options: [
        { id: 'a', label: '"Would you like a break?"', correct: true },
        { id: 'b', label: '"We only have ten minutes left — keep going."', correct: false },
      ],
    },
  ],
  'codesign-section-7': [
    {
      id: 's7-2',
      prompt: 'A participant asks why data goes to Singapore. What do you do?',
      options: [
        { id: 'a', label: 'Read the Section 7 script — do not improvise', correct: true },
        { id: 'b', label: 'Give a shorter summary in your own words', correct: false },
      ],
    },
  ],
  'codesign-section-8': [
    {
      id: 's8-2',
      prompt: 'Where do you store a participant email if they said Yes in Section 7?',
      options: [
        { id: 'a', label: 'Section 8 fields only — never in quotes', correct: true },
        { id: 'b', label: 'In facilitator notes for easy follow-up', correct: false },
      ],
    },
  ],
}

export const CO_DESIGN_SUMMARIES: Record<string, string> = {
  'codesign-golden-rule': "Don't teach — let them try so Monash session data stays usable.",
  'codesign-before-session': 'Pre-session checklist — consent, device, quiet space, breaks.',
  'codesign-welcome-script': 'Read the welcome script aloud — pause after each line.',
  'codesign-during-session': 'Observe, wait 10 seconds, capture their exact words.',
  'codesign-distress-responses': 'Verbatim scripts for confusion, tiredness, distress, or stopping.',
  'codesign-section-7': 'Read Section 7 word-for-word — includes Singapore storage disclosure.',
  'codesign-section-8': 'Section 8 contact details only when Section 7 is Yes — never in quotes.',
  'codesign-quotes-notes': 'Exact quotes, no extra identifiers, notes after they leave.',
  'codesign-privacy-basics': 'What belongs in Session Capture — and what never does.',
  'codesign-practice-capture': 'Practice with fake data — unlocks live capture when you pass.',
}

export const JOB_AID_SLUGS = [
  'codesign-before-session',
  'codesign-welcome-script',
  'codesign-during-session',
  'codesign-quotes-notes',
  'codesign-privacy-basics',
  'codesign-golden-rule',
  'codesign-distress-responses',
  'codesign-section-7',
  'codesign-section-8',
] as const

export function section7ContentBlocks(): TrainingContentBlock[] {
  return [
    {
      id: 'intro',
      type: 'text',
      title: 'Section 7 — say every word',
      body: 'Read this word-for-word every session. Do not paraphrase. Participants must hear the full disclosure including overseas storage.',
    },
    {
      id: 'script',
      type: 'text',
      title: 'Verbatim script',
      body: SECTION_7_SCRIPT,
    },
    {
      id: 'summary',
      type: 'text',
      title: 'Plain-English summary',
      body: `After you read the script above, you do not need to repeat it — but you must not contradict it.

**In plain language, Section 7 tells participants:**
• This session is for education only — not personal financial, legal, tax, or therapy advice.
• We are not part of NDIS and outcomes are not guaranteed.
• NDIS plan claims depend on their plan manager — we cannot promise funding.
• Session notes may be stored overseas (including Singapore).
• Financial Literacy Australia holds the data for Monash project 51358.

If they ask questions, read the script again or direct them to mentors@flaus.com.au — do not improvise.`,
    },
    {
      id: 'attest',
      type: 'attestation',
      attestationLabel: 'I will read Section 7 word-for-word in every live session',
    },
  ]
}

const SECTION_8_RULES = `Section 8 is only if they said Yes in Section 7.

Contact details are stored separately in the app — never copy them into quotes or facilitator notes.

Privacy questions: mentors@flaus.com.au`

export function section8ContentBlocks(): TrainingContentBlock[] {
  return [
    {
      id: 'intro',
      type: 'text',
      title: 'Section 8 — contact details rules',
      body: 'Section 8 collects contact details only when the participant agreed in Section 7. Read these rules before every live Monash 51358 session.',
    },
    {
      id: 'rules',
      type: 'text',
      title: 'Verbatim rules',
      body: SECTION_8_RULES,
    },
    {
      id: 'plain-english',
      type: 'text',
      title: 'Plain-English summary',
      body: `**If they said No in Section 7:** leave Section 8 completely blank — even if they offer an email later.

**If they said Yes:** record name, phone, and email only in Section 8 fields. Those details are stored separately from quotes and facilitator notes.

**Never** copy contact details into quote fields or Section 9 notes — even for "easy follow-up".

Privacy questions: mentors@flaus.com.au`,
    },
    {
      id: 'examples',
      type: 'text',
      title: 'Examples',
      body: `**Example 1 — Yes in Section 7:** Participant agrees to be contacted. You enter email in Section 8 only. Quote field says: "I'd use Pay if I trusted it" — no name or email in the quote.

**Example 2 — No in Section 7:** Participant declines contact. They later say "You can email me anyway." You still leave Section 8 blank and do not record their email anywhere else in the form.`,
    },
    {
      id: 'attest',
      type: 'attestation',
      attestationLabel: 'I will follow Section 8 rules — contact details separate from quotes',
    },
  ]
}
