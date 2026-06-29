import { createHash, randomBytes } from 'node:crypto'

import type { Endpoint, PayloadHandler } from 'payload'
import { z } from 'zod'

import { adminOnly } from '@/access/roles'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth-password'
import { actorIdFromUser, requestMeta, writeAuditLog } from '@/lib/audit'
import { provisionOnboardingFromInvite } from '@/lib/onboarding/provisioning'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['staff', 'manager']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  packId: z.union([z.string(), z.number()]),
  startDate: z.string().datetime().optional(),
  managerId: z.union([z.string(), z.number()]).optional(),
  employeeNumber: z.string().optional(),
  employmentBasis: z.enum(['full_time', 'part_time', 'casual', 'fixed_term']).default('casual'),
  jobProfile: z.enum(['field_worker', 'office_admin', 'co_design_facilitator']).optional(),
  assignedContractIds: z.array(z.union([z.string(), z.number()])).optional(),
  assignedTrainingIds: z.array(z.union([z.string(), z.number()])).optional(),
  assignedPolicyIds: z.array(z.union([z.string(), z.number()])).optional(),
  assignedSurveyIds: z.array(z.union([z.string(), z.number()])).optional(),
  complianceChecks: z.record(z.string(), z.boolean()).optional(),
  expiresInDays: z.number().min(1).max(90).optional(),
})

export const createInvite: Endpoint = {
  path: '/invite/create',
  method: 'post',
  handler: (async (req) => {
    if (!adminOnly({ req })) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    let body: z.infer<typeof inviteSchema>
    try {
      body = inviteSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (body.expiresInDays ?? 14))
    const orgSettings = (await req.payload.findGlobal({
      slug: 'org-settings',
      depth: 0,
      overrideAccess: true,
      req,
    })) as Record<string, unknown>
    const orgDefaultEmploymentBasis =
      typeof orgSettings.defaultEmploymentBasis === 'string'
        ? orgSettings.defaultEmploymentBasis
        : 'casual'
    const employmentBasis = body.employmentBasis ?? orgDefaultEmploymentBasis

    await req.payload.create({
      collection: 'invite-tokens',
      data: {
        email: body.email.toLowerCase(),
        tokenHash,
        role: body.role,
        pack: body.packId,
        startDate: body.startDate,
        manager: body.managerId,
        employeeNumber: body.employeeNumber,
        employmentBasis,
        jobProfile: body.jobProfile,
        assignedContractIds: body.assignedContractIds,
        assignedTrainingIds: body.assignedTrainingIds,
        assignedPolicyIds: body.assignedPolicyIds,
        assignedSurveyIds: body.assignedSurveyIds,
        complianceChecks: body.complianceChecks ?? {},
        expiresAt: expiresAt.toISOString(),
      },
      overrideAccess: true,
      req,
    })

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/login?invite=${token}&email=${encodeURIComponent(body.email)}`

    await writeAuditLog(req.payload, {
      actorId: actorIdFromUser(req.user),
      action: 'auth.invite_create',
      resourceType: 'invite',
      resourceId: body.email,
      ...requestMeta(req),
      metadata: { role: body.role },
    })

    return Response.json({ inviteUrl, expiresAt })
  }) as PayloadHandler,
}

const acceptSchema = z.object({
  token: z.string().min(16),
  email: z.string().email(),
  password: z.string().min(MIN_PASSWORD_LENGTH),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

export const acceptInvite: Endpoint = {
  path: '/invite/accept',
  method: 'post',
  handler: (async (req) => {
    let body: z.infer<typeof acceptSchema>
    try {
      body = acceptSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const tokenHash = createHash('sha256').update(body.token).digest('hex')
    const invites = await req.payload.find({
      collection: 'invite-tokens',
      where: {
        and: [
          { email: { equals: body.email.toLowerCase() } },
          { tokenHash: { equals: tokenHash } },
          { usedAt: { exists: false } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    const invite = invites.docs[0]
    if (!invite) return Response.json({ error: 'invalid_invite' }, { status: 400 })
    if (new Date(String(invite.expiresAt)) < new Date()) {
      return Response.json({ error: 'invite_expired' }, { status: 400 })
    }

    const user = await req.payload.create({
      collection: 'staff-users',
      data: {
        email: body.email.toLowerCase(),
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        role: invite.role,
        status: 'invited',
        onboardingStatus: 'in_progress',
        startDate: invite.startDate,
        jobProfile: invite.jobProfile,
        employmentBasis:
          typeof invite.employmentBasis === 'string' ? invite.employmentBasis : 'casual',
        employeeNumber:
          typeof invite.employeeNumber === 'string' ? invite.employeeNumber : undefined,
        manager: invite.manager,
        employmentType: 'employee',
      },
      overrideAccess: true,
      req,
    })

    const provisioning = await provisionOnboardingFromInvite({
      invite: invite as unknown as Record<string, unknown>,
      userId: user.id,
      req,
    })

    await req.payload.update({
      collection: 'invite-tokens',
      id: invite.id,
      data: { usedAt: new Date().toISOString() },
      overrideAccess: true,
      req,
    })

    await writeAuditLog(req.payload, {
      actorId: user.id,
      action: 'auth.invite_accept',
      resourceType: 'staff-users',
      resourceId: user.id,
      ...requestMeta(req),
    })

    return Response.json({ ok: true, userId: user.id, assignmentId: provisioning.assignmentId })
  }) as PayloadHandler,
}
