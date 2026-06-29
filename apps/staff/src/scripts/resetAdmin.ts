import { getPayload } from 'payload'

import config from '@payload-config'
import { ensureAdminUser } from '../seed'

const payload = await getPayload({ config })
await ensureAdminUser(payload)
process.exit(0)
