const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
const PHONE_PATTERN = /(?:\+?61|0)[\d\s()-]{8,}/
const NDIS_PATTERN = /\b43\d{7}\b/

export type PiiFlag = 'email' | 'phone' | 'ndis_number'

export function scanAnswersForPii(answers: Record<string, unknown>): PiiFlag[] {
  const flags = new Set<PiiFlag>()
  const text = JSON.stringify(answers).toLowerCase()

  if (EMAIL_PATTERN.test(text)) flags.add('email')
  if (PHONE_PATTERN.test(text)) flags.add('phone')
  if (NDIS_PATTERN.test(text)) flags.add('ndis_number')

  return [...flags]
}

export function hasCriticalPiiFlags(flags: PiiFlag[], allowedContactFields: boolean): boolean {
  if (allowedContactFields) {
    return flags.includes('ndis_number')
  }
  return flags.length > 0
}
