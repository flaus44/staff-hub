import * as crypto from 'node:crypto'

import bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'
import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'
import { headersWithCors } from 'payload'
import { z } from 'zod'

import {
  TOTP_HEADER,
  createMfaSessionToken,
  isStaffMfaRole,
  serialiseExpiredMfaCookie,
  serialiseMfaCookie,
} from '@/middleware/staffMfa'

const MFA_ISSUER = 'FLAUS Staff Hub'
const RECOVERY_CODE_COUNT = 10
const BCRYPT_COST = 12

authenticator.options = { ...authenticator.options, window: 1 }

const verifySchema = z.object({
  token: z.string().min(1).max(128).optional(),
})

const mfaSetupHandler: PayloadHandler = async (req) => {
  const guard = requireStaffMfaUser(req)
  if (guard instanceof Response) return guard

  const rawUser = await findRawMfaUser(req, guard.id)
  if (!rawUser) return json(req, { error: 'not_found' }, 404)
  if (rawUser.totpEnabled) return json(req, { error: 'mfa_already_enabled' }, 409)

  const secret = rawUser.totpSecret || authenticator.generateSecret()
  if (!rawUser.totpSecret) {
    await req.payload.update({
      collection: 'staff-users',
      id: guard.id,
      data: { totpSecret: secret, totpEnabled: false, recoveryCodes: [] },
      overrideAccess: true,
      req,
    })
  }

  return json(req, {
    issuer: MFA_ISSUER,
    qrUri: authenticator.keyuri(rawUser.email || guard.email || `user-${guard.id}`, MFA_ISSUER, secret),
  })
}

const mfaVerifySetupHandler: PayloadHandler = async (req) => {
  const guard = requireStaffMfaUser(req)
  if (guard instanceof Response) return guard

  const token = await tokenFromRequest(req)
  if (!token) return json(req, { error: 'invalid_input' }, 400)

  const rawUser = await findRawMfaUser(req, guard.id)
  if (!rawUser?.totpSecret) return json(req, { error: 'mfa_setup_required' }, 409)

  if (!verifyTotp(token, rawUser.totpSecret)) {
    return json(req, { error: 'invalid_mfa_token' }, 401)
  }

  const recoveryCodes = generateRecoveryCodes()
  await req.payload.update({
    collection: 'staff-users',
    id: guard.id,
    data: {
      recoveryCodes: await hashRecoveryCodes(recoveryCodes),
      totpEnabled: true,
    },
    overrideAccess: true,
    req,
  })

  return jsonWithMfaCookie(req, { ok: true, recoveryCodes }, guard.id)
}

const mfaVerifyHandler: PayloadHandler = async (req) => {
  const guard = requireStaffMfaUser(req)
  if (guard instanceof Response) return guard

  const token = await tokenFromRequest(req)
  if (!token) return json(req, { error: 'invalid_input' }, 400)

  const rawUser = await findRawMfaUser(req, guard.id)
  if (!rawUser?.totpEnabled || !rawUser.totpSecret) {
    return json(req, { error: 'mfa_setup_required' }, 409)
  }

  if (!verifyTotp(token, rawUser.totpSecret)) {
    return json(req, { error: 'invalid_mfa_token' }, 401)
  }

  return jsonWithMfaCookie(req, { ok: true }, guard.id)
}

const mfaVerifyRecoveryHandler: PayloadHandler = async (req) => {
  const guard = requireStaffMfaUser(req)
  if (guard instanceof Response) return guard

  const token = await tokenFromRequest(req)
  if (!token) return json(req, { error: 'invalid_input' }, 400)

  const rawUser = await findRawMfaUser(req, guard.id)
  if (!rawUser?.totpEnabled) {
    return json(req, { error: 'mfa_setup_required' }, 409)
  }

  const recoveryCodes = (rawUser as { recoveryCodes?: string[] }).recoveryCodes ?? []
  const matchIndex = await findRecoveryCodeIndex(token, recoveryCodes)
  if (matchIndex < 0) {
    return json(req, { error: 'invalid_mfa_token' }, 401)
  }

  const remaining = recoveryCodes.filter((_, i) => i !== matchIndex)
  await req.payload.update({
    collection: 'staff-users',
    id: guard.id,
    data: { recoveryCodes: remaining },
    overrideAccess: true,
    req,
  })

  return jsonWithMfaCookie(req, { ok: true }, guard.id)
}

const mfaDisableHandler: PayloadHandler = async (req) => {
  const user = req.user
  if (!user) return json(req, { error: 'unauthorised' }, 401)
  if (user.role !== 'admin') return json(req, { error: 'forbidden' }, 403)

  await req.payload.update({
    collection: 'staff-users',
    id: user.id,
    data: { recoveryCodes: [], totpEnabled: false, totpSecret: null },
    overrideAccess: true,
    req,
  })

  const headers = corsHeaders(req)
  headers.set('Set-Cookie', serialiseExpiredMfaCookie())
  return Response.json({ ok: true }, { headers })
}

function requireStaffMfaUser(req: PayloadRequest) {
  const user = req.user
  if (!user) return json(req, { error: 'unauthorised' }, 401)
  if (!isStaffMfaRole(user.role)) return json(req, { error: 'mfa_not_required' }, 403)
  return user
}

async function findRawMfaUser(req: PayloadRequest, id: number | string) {
  return req.payload.findByID({
    collection: 'staff-users',
    id,
    overrideAccess: true,
    depth: 0,
  }) as Promise<{ totpEnabled?: boolean; totpSecret?: string; email?: string; recoveryCodes?: string[] } | null>
}

async function findRecoveryCodeIndex(code: string, hashedCodes: string[]): Promise<number> {
  const normalised = code.trim().toLowerCase().replace(/\s+/g, '')
  for (let i = 0; i < hashedCodes.length; i++) {
    const hash = hashedCodes[i]
    if (typeof hash === 'string' && (await bcrypt.compare(normalised, hash))) {
      return i
    }
  }
  return -1
}

function verifyTotp(token: string, secret: string): boolean {
  const normalised = token.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(normalised)) return false
  try {
    return authenticator.check(normalised, secret)
  } catch {
    return false
  }
}

function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const value = crypto.randomBytes(10).toString('hex').toLowerCase()
    return value.match(/.{1,5}/g)?.join('-') ?? value
  })
}

async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(code.trim().toLowerCase(), BCRYPT_COST)))
}

async function tokenFromRequest(req: PayloadRequest): Promise<string | null> {
  const headerToken = req.headers.get(TOTP_HEADER)
  if (headerToken) return headerToken.trim()
  try {
    const parsed = verifySchema.parse(await req.json?.())
    return parsed.token?.trim() || null
  } catch {
    return null
  }
}

function corsHeaders(req: PayloadRequest): Headers {
  const headers = headersWithCors({ headers: new Headers(), req })
  headers.set('Cache-Control', 'no-store')
  return headers
}

function json(req: PayloadRequest, body: unknown, status = 200): Response {
  return Response.json(body, { headers: corsHeaders(req), status })
}

async function jsonWithMfaCookie(req: PayloadRequest, body: unknown, userId: string | number) {
  const headers = corsHeaders(req)
  headers.set('Set-Cookie', serialiseMfaCookie(await createMfaSessionToken(userId)))
  return Response.json(body, { headers })
}

export const mfaSetup: Endpoint = { path: '/mfa/setup', method: 'post', handler: mfaSetupHandler }
export const mfaVerifySetup: Endpoint = { path: '/mfa/verify-setup', method: 'post', handler: mfaVerifySetupHandler }
export const mfaVerify: Endpoint = { path: '/mfa/verify', method: 'post', handler: mfaVerifyHandler }
export const mfaVerifyRecovery: Endpoint = {
  path: '/mfa/verify-recovery',
  method: 'post',
  handler: mfaVerifyRecoveryHandler,
}
export const mfaDisable: Endpoint = { path: '/mfa/disable', method: 'post', handler: mfaDisableHandler }
