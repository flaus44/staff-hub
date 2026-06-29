export function relId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}

export function relIdNumber(value: unknown): number | null {
  const id = relId(value)
  if (!id) return null
  const num = Number(id)
  return Number.isFinite(num) ? num : null
}
