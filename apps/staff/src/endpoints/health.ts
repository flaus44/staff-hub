import type { Endpoint } from 'payload'

export const healthCheck: Endpoint = {
  path: '/health',
  method: 'get',
  handler: async () => {
    return Response.json({ ok: true, service: 'staff-hub' })
  },
}
