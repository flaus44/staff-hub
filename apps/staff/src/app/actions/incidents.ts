'use server'

import { revalidatePath } from 'next/cache'

import { getCurrentUser, getPayloadClient } from '@/lib/payload'

export async function updateIncidentStatus(incidentId: string, status: string) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return { error: 'forbidden' }
  }

  const allowed = ['submitted', 'under_review', 'closed', 'draft']
  if (!allowed.includes(status)) {
    return { error: 'invalid_status' }
  }

  const payload = await getPayloadClient()
  await payload.update({
    collection: 'incidents',
    id: incidentId,
    data: { status: status as 'submitted' | 'under_review' | 'closed' | 'draft' },
  })

  revalidatePath(`/incidents/${incidentId}`)
  revalidatePath('/incidents')
  return { ok: true }
}
