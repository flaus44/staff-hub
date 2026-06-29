export function packJoinPath(slug: string): string {
  return `/onboard/${encodeURIComponent(slug)}`
}

export function packJoinUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${base}${packJoinPath(slug)}`
}
