const AU = 'en-AU'

export function formatAuDate(iso: string): string {
  return new Date(iso).toLocaleDateString(AU, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatAuTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(AU, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatAuDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString(AU, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export type ShiftDuration = {
  grossMinutes: number
  netMinutes: number
  hours: number
  minutes: number
}

export function calcShiftDuration(
  clockIn: string,
  clockOut?: string | null,
  breakMinutes = 0,
): ShiftDuration | null {
  if (!clockOut) return null
  const grossMinutes = Math.max(
    0,
    Math.floor((new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 60_000),
  )
  const netMinutes = Math.max(0, grossMinutes - breakMinutes)
  return {
    grossMinutes,
    netMinutes,
    hours: Math.floor(netMinutes / 60),
    minutes: netMinutes % 60,
  }
}

export function formatWorkedDuration(duration: ShiftDuration): string {
  const { hours, minutes } = duration
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} hr`
  return `${hours} hr ${minutes} min`
}

export function formatBreakMinutes(breakMinutes: number): string {
  if (breakMinutes <= 0) return 'No break'
  if (breakMinutes < 60) return `${breakMinutes} min break`
  const h = Math.floor(breakMinutes / 60)
  const m = breakMinutes % 60
  if (m === 0) return `${h} hr break`
  return `${h} hr ${m} min break`
}

/** Decimal hours for payroll CSV export (e.g. 8.48). */
export function formatDecimalHours(netMinutes: number): string {
  return (netMinutes / 60).toFixed(2)
}
