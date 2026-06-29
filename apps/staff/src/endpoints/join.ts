import type { Endpoint, PayloadHandler } from 'payload'
import { z } from 'zod'

import { MIN_PASSWORD_LENGTH } from '@/lib/auth-password'
import { actorIdFromUser, requestMeta, writeAuditLog } from '@/lib/audit'
import { provisionOnboardingFromPack } from '@/lib/onboarding/provisioning'

const joinSchema = z.object({
  packSlug: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(MIN_PASSWORD_LENGTH),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  startDate: z.string().optional(),
})

function roleFromPack(portalRoles: unknown): 'staff' | 'manager' {
  const roles = Array.isArray(portalRoles) ? portalRoles.map(String) : []
  if (roles.includes('staff')) return 'staff'
  if (roles.includes('manager')) return 'manager'
  return 'staff'
}

function firstEmploymentBasis(pack: Record<string, unknown>): string | undefined {
  const values = pack.employmentBasis
  if (!Array.isArray(values) || values.length === 0) return undefined
  const first = values[0]
  return typeof first === 'string' ? first : undefined
}

function defaultEmploymentBasisFromSettings(settings: Record<string, unknown>): string {
  const value = settings.defaultEmploymentBasis
  return typeof value === 'string' && value.length > 0 ? value : 'casual'
}

export const joinOnboardingPack: Endpoint = {
  path: '/onboarding/join',
  method: 'post',
  handler: (async (req) => {
    let body: z.infer<typeof joinSchema>
    try {
      body = joinSchema.parse(await req.json?.())
    } catch (error) {
      if (error instanceof z.ZodError) {
        const passwordIssue = error.issues.find((issue) => issue.path[0] === 'password')
        if (passwordIssue) {
          return Response.json(
            {
              error: 'invalid_password',
              message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
            },
            { status: 400 },
          )
        }
      }
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const packs = await req.payload.find({
      collection: 'onboarding-packs',
      where: {
        and: [{ slug: { equals: body.packSlug } }, { active: { equals: true } }],
      },
      limit: 1,
      overrideAccess: true,
      req,
    })

    const pack = packs.docs[0]
    if (!pack) {
      return Response.json({ error: 'pack_not_found' }, { status: 404 })
    }

    const email = body.email.toLowerCase()
    const existing = await req.payload.find({
      collection: 'staff-users',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
      req,
    })

    if (existing.docs[0]) {
      return Response.json({ error: 'email_in_use' }, { status: 409 })
    }

    const packRecord = pack as unknown as Record<string, unknown>
    const orgSettings = (await req.payload.findGlobal({
      slug: 'org-settings',
      depth: 0,
      overrideAccess: true,
      req,
    })) as Record<string, unknown>
    const role = roleFromPack(packRecord.portalRoles)
    const jobProfile =
      typeof packRecord.jobProfile === 'string' ? packRecord.jobProfile : undefined
    const employmentBasis =
      firstEmploymentBasis(packRecord) ?? defaultEmploymentBasisFromSettings(orgSettings)
    const startDate = body.startDate ?? new Date().toISOString().slice(0, 10)
    const startDateIso = new Date(startDate).toISOString()

    const user = await req.payload.create({
      collection: 'staff-users',
      data: {
        email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        role,
        status: 'invited',
        onboardingStatus: 'in_progress',
        startDate: startDateIso,
        jobProfile,
        employmentBasis,
        employmentType: 'employee',
      },
      overrideAccess: true,
      req,
    })

    try {
      const provisioning = await provisionOnboardingFromPack({
        packId: String(pack.id),
        userId: user.id,
        req,
        startDate: startDateIso,
      })

      await writeAuditLog(req.payload, {
        actorId: actorIdFromUser(user),
        action: 'auth.invite_accept',
        resourceType: 'staff-users',
        resourceId: user.id,
        ...requestMeta(req),
        metadata: { packSlug: body.packSlug, joinLink: true },
      })

      return Response.json({
        ok: true,
        userId: user.id,
        assignmentId: provisioning.assignmentId,
      })
    } catch (error) {
      await req.payload
        .delete({
          collection: 'staff-users',
          id: user.id,
          overrideAccess: true,
          req,
        })
        .catch(() => undefined)

      const message = error instanceof Error ? error.message : 'provisioning_failed'
      return Response.json({ error: 'provisioning_failed', message }, { status: 500 })
    }
  }) as PayloadHandler,
}
