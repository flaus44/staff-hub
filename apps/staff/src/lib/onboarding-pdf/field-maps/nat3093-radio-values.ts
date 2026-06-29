export const NAT309_TITLE_EXPORTS = ['Mr', 'Mrs', 'Miss', 'Ms'] as const

export type Nat309TitleExport = (typeof NAT309_TITLE_EXPORTS)[number]

export function resolveNat309TitleExport(value: unknown): Nat309TitleExport | '' {
  const title = String(value ?? '').trim()
  return (NAT309_TITLE_EXPORTS as readonly string[]).includes(title) ? (title as Nat309TitleExport) : ''
}

export const NAT3093_RESIDENCY_EXPORTS: Record<string, string> = {
  australian_resident: 'Australian#20resident',
  foreign_resident: 'foreign#20resident',
  working_holiday_maker: 'Working#20holiday#20maker',
}

export const NAT3093_YES_NO_EXPORT = {
  yes: 'Yes',
  no: 'No',
} as const

export const NAT3093_MEDICARE_EXEMPTION_EXPORTS = {
  none: '',
  single: 'Single',
  illness: 'illness',
  couple: 'couple',
} as const
