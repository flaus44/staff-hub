import { getPayload } from 'payload'

import config from '@payload-config'
import { ensureOrgSettings } from '../seed'

const payload = await getPayload({ config })
await ensureOrgSettings(payload)
process.exit(0)
