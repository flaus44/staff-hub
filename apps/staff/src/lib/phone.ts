export function normaliseAustralianPhone(value: unknown): string {
  return String(value ?? '').replace(/[\s()-]/g, '')
}

export function toDiditMobilePhone(value: unknown): string | null {
  const normalised = normaliseAustralianPhone(value)
  if (/^04\d{8}$/.test(normalised)) return `+61${normalised.slice(1)}`
  if (/^\+614\d{8}$/.test(normalised)) return normalised
  if (/^614\d{8}$/.test(normalised)) return `+${normalised}`
  return null
}
