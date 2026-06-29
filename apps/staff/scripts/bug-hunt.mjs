/**

 * Automated portal smoke test — login and exercise key routes/APIs.

 * Usage: node scripts/bug-hunt.mjs

 */

const BASE = process.env.BASE_URL || 'http://localhost:3000'

const EMAIL = process.env.TEST_EMAIL || 'admin@flaus.com.au'

const PASSWORD = process.env.TEST_PASSWORD || 'changeme'



const jar = new Map()



function parseSetCookie(headers) {

  const raw = headers.getSetCookie?.() ?? []

  for (const line of raw) {

    const [pair] = line.split(';')

    const eq = pair.indexOf('=')

    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())

  }

}



function cookieHeader() {

  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')

}



async function request(path, options = {}) {

  const url = `${BASE}${path}`

  const headers = { ...(options.headers || {}) }

  const cookie = cookieHeader()

  if (cookie) headers.Cookie = cookie

  const res = await fetch(url, { ...options, headers, redirect: 'manual' })

  parseSetCookie(res.headers)

  const text = await res.text().catch(() => '')

  return { status: res.status, url, text, location: res.headers.get('location') }

}



async function login() {

  const res = await request('/api/staff-users/login', {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),

  })

  if (res.status !== 200 && res.status !== 201) {

    throw new Error(`Login failed: ${res.status} ${res.text.slice(0, 200)}`)

  }

  return res

}



function pass(results, failures, label, ok, extra = {}) {

  const entry = { label, ok, ...extra }

  results.push(entry)

  if (!ok) failures.push(entry)

  return entry

}



const portalPages = [

  '/dashboard',

  '/timesheets',

  '/surveys',

  '/training',

  '/policies',

  '/contracts',

  '/incidents',

  '/incidents/new',

  '/mfa-verify',

  '/admin',

]



const apiChecks = [

  { method: 'GET', path: '/api/time-entries?limit=5' },

  { method: 'GET', path: '/api/incidents?limit=5' },

  { method: 'GET', path: '/api/training-modules?limit=20' },

  { method: 'GET', path: '/api/contracts?limit=5' },

  { method: 'GET', path: '/api/health' },

]



async function main() {

  const results = []

  const failures = []



  console.log(`Bug hunt — ${BASE} as ${EMAIL}\n`)



  try {

    await login()

    pass(results, failures, 'POST /api/staff-users/login', true)

  } catch (e) {

    console.error('FATAL: cannot login', e)

    process.exit(1)

  }



  for (const path of portalPages) {

    const res = await request(path)

    const ok = res.status === 200

    pass(results, failures, `GET ${path}`, ok, { status: res.status })

  }



  for (const { method, path } of apiChecks) {

    const res = await request(path, { method })

    const ok = res.status >= 200 && res.status < 400

    pass(results, failures, `${method} ${path}`, ok, { status: res.status })

  }



  // Training + policy detail pages

  const modulesRes = await request('/api/training-modules?limit=50&depth=0')

  if (modulesRes.status === 200) {

    try {

      const data = JSON.parse(modulesRes.text)

      const docs = data.docs ?? []

      const policies = docs.filter((d) => d.moduleType === 'policy_procedure')

      const training = docs.filter((d) => !d.moduleType || d.moduleType === 'training')



      pass(results, failures, 'training-modules split', policies.length > 0 && training.length > 0, {

        detail: `${training.length} training, ${policies.length} policies`,

      })



      if (training[0]?.slug) {

        const detail = await request(`/training/${training[0].slug}`)

        pass(results, failures, `GET /training/${training[0].slug}`, detail.status === 200, {

          status: detail.status,

        })

      }



      for (const policy of policies.slice(0, 2)) {

        const detail = await request(`/policies/${policy.slug}`)

        pass(results, failures, `GET /policies/${policy.slug}`, detail.status === 200, {

          status: detail.status,

        })

      }

    } catch (e) {

      pass(results, failures, 'module parse', false, { error: String(e) })

    }

  }



  // Admin exit button present in admin HTML

  const admin = await request('/admin')

  const hasExitBtn =

    admin.status === 200 &&

    (admin.text.includes('staff-hub-admin-exit-btn') || admin.text.includes('Staff portal'))

  pass(results, failures, 'admin exit button in HTML', hasExitBtn, { status: admin.status })



  // Incident create API

  const incident = await request('/api/incidents', {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({

      occurredAt: new Date().toISOString(),

      location: 'Bug hunt test',

      category: 'near_miss',

      description: 'Automated smoke test incident — safe to delete',

      status: 'submitted',

      severity: 'low',

      treatmentRequired: false,

      piiAcknowledged: true,

    }),

  })

  const incidentOk = incident.status === 200 || incident.status === 201

  pass(results, failures, 'POST /api/incidents', incidentOk, { status: incident.status })



  let incidentId = null

  if (incidentOk) {

    try {

      const data = JSON.parse(incident.text)

      incidentId = data.doc?.id ?? data.id

      if (incidentId) {

        const detail = await request(`/incidents/${incidentId}`)

        pass(results, failures, `GET /incidents/${incidentId}`, detail.status === 200, {

          status: detail.status,

        })

        const submitted = await request(`/incidents/${incidentId}/submitted`)

        pass(results, failures, `GET /incidents/${incidentId}/submitted`, submitted.status === 200, {

          status: submitted.status,

        })

      }

    } catch {

      pass(results, failures, 'incident detail routes', false)

    }

  }



  // Clock-in smoke (idempotent if already clocked in)

  const clockIn = await request('/api/portal/timesheets/clock-in', {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ projectTag: 'General' }),

  })

  const clockOk = clockIn.status === 200 || clockIn.status === 409

  pass(results, failures, 'POST clock-in', clockOk, {

    status: clockIn.status,

    detail: clockIn.status === 409 ? 'already clocked in (ok)' : undefined,

  })



  // Dashboard should mention policies when they exist

  const dash = await request('/dashboard')

  const dashHasPolicies =

    dash.status === 200 &&

    (dash.text.includes('Policies') || dash.text.includes('policies') || dash.text.includes('All caught up'))

  pass(results, failures, 'dashboard renders policy/training context', dashHasPolicies, {

    status: dash.status,

  })



  console.log('Results:')

  for (const r of results) {

    const mark = r.ok ? 'PASS' : 'FAIL'

    console.log(`  [${mark}] ${r.label}${r.status ? ` (${r.status})` : ''}${r.detail ? ` — ${r.detail}` : ''}`)

  }



  if (failures.length) {

    console.log(`\n${failures.length} failure(s):`)

    for (const f of failures) {

      console.log(' ', f.label, f.status ?? '', f.detail ?? f.error ?? '')

    }

    process.exit(1)

  }



  console.log('\nAll checks passed.')

}



main().catch((e) => {

  console.error(e)

  process.exit(1)

})


