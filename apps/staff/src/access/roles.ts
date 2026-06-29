import type { PayloadRequest, User } from 'payload'

export type StaffRole = 'admin' | 'manager' | 'staff' | 'contractor'

export type StaffUser = User & {
  id: number | string
  role?: StaffRole
  manager?: number | string | { id: number | string } | null
}

export const STAFF_MFA_ROLES: StaffRole[] = ['admin', 'manager']

export function getUserId(user: StaffUser | null | undefined): string | null {
  if (!user?.id) return null
  return String(user.id)
}

/** Extract ID from a Payload relationship field (number, string, or populated doc). */
export function relationId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
    return null
  }
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return null
}

export function getUserRole(user: StaffUser | null | undefined): StaffRole | null {
  const role = user?.role
  if (role === 'admin' || role === 'manager' || role === 'staff' || role === 'contractor') {
    return role
  }
  return null
}

export function isAdmin(user: StaffUser | null | undefined): boolean {
  return getUserRole(user) === 'admin'
}

export function isManager(user: StaffUser | null | undefined): boolean {
  return getUserRole(user) === 'manager'
}

export function isPrivileged(user: StaffUser | null | undefined): boolean {
  const role = getUserRole(user)
  return role === 'admin' || role === 'manager'
}

export function getManagerId(user: StaffUser | null | undefined): string | null {
  const manager = user?.manager
  if (!manager) return null
  if (typeof manager === 'object' && manager !== null && 'id' in manager) {
    return String(manager.id)
  }
  return String(manager)
}

export function isSelfOrManager(
  req: PayloadRequest,
  targetUserId: number | string | undefined | null,
): boolean {
  const user = req.user as StaffUser | undefined
  if (!user) return false
  if (String(user.id) === String(targetUserId)) return true
  if (isAdmin(user)) return true
  if (isManager(user) && String(targetUserId) === getManagerId(user)) return false
  if (isManager(user)) {
    return true // refined per-collection with manager link query
  }
  return false
}

export function authenticated({ req }: { req: PayloadRequest }): boolean {
  return Boolean(req.user)
}

export function adminOnly({ req }: { req: PayloadRequest }): boolean {
  return isAdmin(req.user as StaffUser)
}

export function adminOrManager({ req }: { req: PayloadRequest }): boolean {
  return isPrivileged(req.user as StaffUser)
}

export async function getDirectReportIds(
  req: PayloadRequest,
  managerId: string,
): Promise<string[]> {
  const result = await req.payload.find({
    collection: 'staff-users',
    where: { manager: { equals: managerId } },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs.map((doc) => String(doc.id))
}

export async function canAccessUserRecord(
  req: PayloadRequest,
  targetUserId: string,
): Promise<boolean> {
  const user = req.user as StaffUser | undefined
  if (!user) return false
  if (isAdmin(user)) return true
  if (String(user.id) === targetUserId) return true
  if (isManager(user)) {
    const reports = await getDirectReportIds(req, String(user.id))
    return reports.includes(targetUserId)
  }
  return false
}
