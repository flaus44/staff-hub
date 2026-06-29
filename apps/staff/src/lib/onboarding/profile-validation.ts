export const PROFILE_TASK_REQUIRED_FIELDS = [
  'title',
  'dateOfBirth',
  'mobile',
  'addressLine1',
  'suburb',
  'state',
  'postcode',
  'emergencyContactName',
  'emergencyContactPhone',
  'emergencyContactRelationship',
] as const

export const TAX_PROFILE_REQUIRED_FIELDS = [
  'title',
  'dateOfBirth',
  'mobile',
  'addressLine1',
  'suburb',
  'state',
  'postcode',
] as const

export function getMissingProfileFields(
  profile: Record<string, unknown>,
  fields: readonly string[],
): string[] {
  return fields.filter((field) => {
    const value = profile[field]
    if (typeof value === 'string') return value.trim() === ''
    return value === null || value === undefined
  })
}
