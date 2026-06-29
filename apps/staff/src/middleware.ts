import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { staffHubMiddleware } from '@/middleware/staffMfa'

export async function middleware(request: NextRequest) {
  return staffHubMiddleware(request)
}

export const config = {
  matcher: [
    '/onboarding/:path*',
    '/hub/:path*',
    '/dashboard/:path*',
    '/timesheets/:path*',
    '/surveys/:path*',
    '/training/:path*',
    '/policies/:path*',
    '/contracts/:path*',
    '/incidents/:path*',
    '/mfa-verify',
    '/admin/:path*',
    '/api/portal/:path*',
  ],
}
