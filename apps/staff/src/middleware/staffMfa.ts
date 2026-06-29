import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'

export const STAFF_MFA_ROLES = ['admin', 'manager'] as const
export type StaffMfaRole = (typeof STAFF_MFA_ROLES)[number]

export const MFA_SESSION_COOKIE = 'mfa_verified'
export const MFA_SESSION_TTL_SECONDS = 8 * 60 * 60
export const TOTP_HEADER = 'x-totp-token'

const MFA_COOKIE_PURPOSE = 'staff-mfa'
const PAYLOAD_COOKIE_NAME = 'payload-token'
const MFA_VERIFY_PATH = '/mfa-verify'

export function isStaffMfaRole(role: unknown): role is StaffMfaRole {
  return typeof role === 'string' && STAFF_MFA_ROLES.includes(role as StaffMfaRole)
}

export function isPortalProtectedPath(pathname: string): boolean {
  const protectedPrefixes = [
    '/dashboard',
    '/hub',
    '/onboarding',
    '/timesheets',
    '/surveys',
    '/training',
    '/contracts',
    '/incidents',
  ]
  return protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function isMfaProtectedPath(pathname: string): boolean {
  return (
    isPortalProtectedPath(pathname) ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/api/portal/')
  )
}

export async function createMfaSessionToken(userId: string | number): Promise<string> {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET required')
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ purpose: MFA_COOKIE_PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt(now)
    .setExpirationTime(now + MFA_SESSION_TTL_SECONDS)
    .sign(new TextEncoder().encode(secret))
}

export async function verifyMfaSessionForUser(
  token: string | undefined,
  userId: string | number,
): Promise<boolean> {
  if (!token) return false
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) return false
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret))
    return verified.payload.sub === String(userId) && verified.payload.purpose === MFA_COOKIE_PURPOSE
  } catch {
    return false
  }
}

export function serialiseMfaCookie(value: string, maxAge = MFA_SESSION_TTL_SECONDS): string {
  return [
    `${MFA_SESSION_COOKIE}=${value}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export function serialiseExpiredMfaCookie(): string {
  return serialiseMfaCookie('', 0)
}

function isBypassPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === MFA_VERIFY_PATH ||
    pathname.startsWith(`${MFA_VERIFY_PATH}/`) ||
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/login') ||
    pathname === '/api/health' ||
    pathname.startsWith('/api/invite/')
  )
}

export async function staffHubMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  if (!isMfaProtectedPath(pathname) && !isPortalProtectedPath(pathname)) {
    return NextResponse.next()
  }

  if (isBypassPath(pathname)) {
    return NextResponse.next()
  }

  // Edge middleware cannot rely on PAYLOAD_SECRET for JWT verify — validate via Payload /me API.
  const user = await getAuthenticatedUser(request)

  if (isPortalProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!user || !isStaffMfaRole(user.role)) {
    return NextResponse.next()
  }

  if (process.env.NODE_ENV === 'development' && process.env.MFA_ENFORCE !== 'true') {
    return NextResponse.next()
  }

  const mfaCookie = request.cookies.get(MFA_SESSION_COOKIE)?.value
  if (await verifyMfaSessionForUser(mfaCookie, user.id)) {
    return NextResponse.next()
  }

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = MFA_VERIFY_PATH
  redirectUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(redirectUrl)
}

async function getAuthenticatedUser(
  request: NextRequest,
): Promise<{ id: string; role?: string } | null> {
  const cookie = request.headers.get('cookie')
  if (!cookie?.includes(PAYLOAD_COOKIE_NAME)) return null

  try {
    const res = await fetch(new URL('/api/staff-users/me', request.nextUrl.origin), {
      cache: 'no-store',
      headers: { cookie },
    })
    if (!res.ok) return null

    const data = (await res.json()) as { user?: { id?: unknown; role?: unknown } }
    const id = data.user?.id
    if (typeof id !== 'string' && typeof id !== 'number') return null

    return {
      id: String(id),
      role: typeof data.user?.role === 'string' ? data.user.role : undefined,
    }
  } catch {
    return null
  }
}
