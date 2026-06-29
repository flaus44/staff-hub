import type { Where } from 'payload'

export type EmployeePortalRole = 'staff' | 'manager'

export function employeePortalRole(role: unknown): EmployeePortalRole {
  return role === 'manager' ? 'manager' : 'staff'
}

export function byApplicableRoles(role: EmployeePortalRole): Where {
  return {
    or: [
      { applicableRoles: { in: [role] } },
      { applicableRoles: { exists: false } },
    ],
  }
}

export function byRequiredForRoles(role: EmployeePortalRole): Where {
  return {
    or: [
      { requiredForRoles: { in: [role] } },
      { requiredForRoles: { exists: false } },
    ],
  }
}

const ROLE_FILTER_FALLBACK_ERRORS = [
  /no such table/i,
  /does not exist/i,
  /unknown column/i,
  /column .* does not exist/i,
]

const APPLICABLE_ROLES_TABLE = /contracts_applicable_roles|applicable_roles|applicableRoles/i
const REQUIRED_ROLES_TABLE = /training_modules_required_for_roles|required_for_roles|requiredForRoles/i

function errorMessage(error: unknown): string {
  if (!error) return ''
  if (error instanceof Error) return `${error.message}\n${error.stack ?? ''}`
  return String(error)
}

export function shouldFallbackRoleFilter(
  error: unknown,
  field: 'applicableRoles' | 'requiredForRoles',
): boolean {
  const message = errorMessage(error)
  const missingSchemaIssue = ROLE_FILTER_FALLBACK_ERRORS.some((pattern) => pattern.test(message))
  if (!missingSchemaIssue) return false
  const fieldPattern = field === 'applicableRoles' ? APPLICABLE_ROLES_TABLE : REQUIRED_ROLES_TABLE
  return fieldPattern.test(message)
}
