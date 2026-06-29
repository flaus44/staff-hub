type PortalUser = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  role?: string | null
}

export function portalShellUser(user: PortalUser) {
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  return {
    userName: name || user.email || undefined,
    userEmail: user.email || undefined,
    userRole: user.role || undefined,
  }
}
