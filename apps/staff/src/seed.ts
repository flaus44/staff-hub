import type { Payload } from 'payload'

import {
  buildSessionCaptureFields,
  SESSION_CAPTURE_LIVE_SLUG,
  SESSION_CAPTURE_PRACTICE_SLUG,
} from '@/lib/session-capture-fields'
import {
  ensureCoDesignTrainingModules,
  ensureLearningModules,
  ensureUniversalTrainingModules,
} from '@/lib/training-seeds/upsert'

export {
  ensureCoDesignTrainingModules,
  ensureLearningModules,
  ensureUniversalTrainingModules,
} from '@/lib/training-seeds/upsert'

const DEFAULT_SUPER_FUND = {
  name: 'AustralianSuper',
  usi: 'STA0100AU',
  abn: '65714394898',
}

/** Canonical employer values from docs/form-audit/employer-data-worksheet.md (2026-06-27). */
export const WORKSHEET_ORG_SETTINGS = {
  employerLegalName: 'TEX Education Pty Ltd',
  employerTradingName: 'Financial Literacy Australia',
  employerAbn: '87671583387',
  employerAddressLine1: '9 Alexander Ave',
  employerAddressLine2: '',
  employerAddressSuburb: 'Horsham',
  employerAddressState: 'VIC',
  employerAddressPostcode: '3400',
  employerBusinessAddress: '9 Alexander Ave\nHorsham VIC 3400',
  payerBranchNumber: '',
  payrollContactName: 'Daniel Ross',
  payrollContactPhone: '03 9968 5884',
  payrollContactEmail: 'accounts@flaus.com.au',
  authorizedSignatoryName: 'Daniel Ross',
  authorizedSignatoryTitle: 'Managing Director',
  payerDeclarationDatePolicy: 'auto' as const,
  payrollSystemName: 'Xero',
  defaultSuperFundName: DEFAULT_SUPER_FUND.name,
  defaultSuperFundUsi: DEFAULT_SUPER_FUND.usi,
  defaultSuperFundAbn: DEFAULT_SUPER_FUND.abn,
  defaultEmploymentBasis: 'casual' as const,
  enableStapledSuperReview: true,
  templates: {
    nat3092Version: 'NAT3092-06.2019',
    nat3093Version: 'NAT3093-current',
    nat13080Version: 'NAT13080-2023-04',
    fwisVersion: 'FWIS-current',
    ceisVersion: 'CEIS-current',
    ftcisVersion: 'FTCIS-current',
  },
}

async function ensureSampleContract(payload: Payload): Promise<void> {
  const existingContract = await payload.find({
    collection: 'contracts',
    where: { title: { equals: 'Employment Agreement' } },
    limit: 1,
    overrideAccess: true,
  })

  if (existingContract.docs.length > 0) return

  await payload.create({
    collection: 'contracts',
    data: {
      title: 'Employment Agreement',
      bodyText:
        'This employment agreement sets out the terms and conditions between you and Financial Literacy Australia. Complete your details on the following screens, review the generated contract, then sign electronically.',
      version: 1,
      required: true,
      useDefaultForm: true,
      requireDiditVerification: true,
      applicableRoles: ['staff', 'contractor', 'manager'],
    },
    overrideAccess: true,
  })

  console.log('[seed] Created sample Employment Agreement contract')
}

const SESSION_CAPTURE_FORM_VERSION = '2.0'

export async function ensureSessionCaptureTemplates(payload: Payload): Promise<void> {
  const templates = [
    {
      slug: SESSION_CAPTURE_LIVE_SLUG,
      title: 'Session Capture V2.0 (Live)',
      formKind: 'session_capture' as const,
      captureMode: 'live' as const,
      fields: buildSessionCaptureFields('live'),
    },
    {
      slug: SESSION_CAPTURE_PRACTICE_SLUG,
      title: 'Session Capture V2.0 (Practice)',
      formKind: 'session_capture' as const,
      captureMode: 'practice' as const,
      fields: buildSessionCaptureFields('practice'),
    },
  ]

  for (const tpl of templates) {
    const existing = await payload.find({
      collection: 'survey-templates',
      where: { slug: { equals: tpl.slug } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length === 0) {
      await payload.create({
        collection: 'survey-templates',
        data: {
          slug: tpl.slug,
          title: tpl.title,
          formKind: tpl.formKind,
          captureMode: tpl.captureMode,
          formVersion: SESSION_CAPTURE_FORM_VERSION,
          status: 'published',
          piiWarning: true,
          fields: tpl.fields,
          version: 2,
          description: 'Monash 51358 co-design session capture â€” digital form in Co-design hub',
        },
        overrideAccess: true,
      })
      console.log(`[seed] Created survey template ${tpl.slug}`)
      continue
    }

    const doc = existing.docs[0]
    await payload.update({
      collection: 'survey-templates',
      id: doc.id,
      data: {
        formVersion: SESSION_CAPTURE_FORM_VERSION,
        fields: tpl.fields,
      },
      overrideAccess: true,
    })
    console.log(`[seed] Upserted survey template ${tpl.slug}`)
  }
}


export async function ensureContactDataViewer(payload: Payload): Promise<void> {
  const emails = [
    process.env.CONTACT_DATA_VIEWER_EMAIL,
    process.env.SEED_ADMIN_EMAIL || 'admin@flaus.com.au',
    'accounts@flaus.com.au',
  ].filter(Boolean) as string[]

  const seen = new Set<string>()
  for (const email of emails) {
    const normalised = email.toLowerCase().trim()
    if (seen.has(normalised)) continue
    seen.add(normalised)

    const existing = await payload.find({
      collection: 'staff-users',
      where: { email: { equals: normalised } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length === 0) continue

    await payload.update({
      collection: 'staff-users',
      id: existing.docs[0].id,
      data: { contactDataViewer: true },
      overrideAccess: true,
    })
    console.log(`[seed] Set contactDataViewer on ${normalised}`)
  }
}

export async function ensureOrgSettings(payload: Payload): Promise<void> {
  await payload.updateGlobal({
    slug: 'org-settings',
    data: WORKSHEET_ORG_SETTINGS,
    overrideAccess: true,
  })

  console.log('[seed] Upserted org-settings from employer-data-worksheet')
}

export async function ensureAdminUser(payload: Payload): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@flaus.com.au'
  const password = process.env.SEED_ADMIN_PASSWORD || 'changeme'

  const existing = await payload.find({
    collection: 'staff-users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'staff-users',
      id: existing.docs[0].id,
      data: {
        password,
        status: 'active',
        loginAttempts: 0,
        contactDataViewer: true,
      },
      overrideAccess: true,
    })
    console.log(`[seed] Reset password and unlocked ${email}`)
    return
  }

  await payload.create({
    collection: 'staff-users',
    data: {
      email,
      password,
      firstName: 'FLAUS',
      lastName: 'Admin',
      role: 'admin',
      status: 'active',
      contactDataViewer: true,
    },
    overrideAccess: true,
  })

  console.log(`[seed] Created ${email}`)
}

export async function seed(payload: Payload): Promise<void> {
  await ensureSampleContract(payload)
  await ensureSessionCaptureTemplates(payload)
  await ensureCoDesignTrainingModules(payload)
  await ensureUniversalTrainingModules(payload)
  await ensureLearningModules(payload)
  await ensureOrgSettings(payload)
  await ensureContactDataViewer(payload)

  const existing = await payload.find({
    collection: 'staff-users',
    where: { email: { equals: 'admin@flaus.com.au' } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    console.log('[seed] Admin already exists, skipping user seed')
    return
  }

  await ensureAdminUser(payload)
}
