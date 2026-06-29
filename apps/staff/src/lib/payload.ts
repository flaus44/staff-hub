import config from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'

export async function getPayloadClient() {
  return getPayload({ config })
}

export async function getCurrentUser() {
  const payload = await getPayloadClient()
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  return user
}
