/**
 * Onboarding API smoke for join/task/document/review flows.
 *
 * Usage: node apps/staff/scripts/onboarding-smoke.mjs
 */
const BASE = process.env.BASE_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.TEST_EMAIL || 'admin@flaus.com.au'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.TEST_PASSWORD || 'changeme'
const TEST_PASSWORD = process.env.ONBOARDING_TEST_PASSWORD || 'SmokePass123!'

const jar = new Map()
const results = []
const failures = []

function parseSetCookie(headers) {
  const raw = headers.getSetCookie?.() ?? []
  for (const line of raw) {
    const [pair] = line.split(';')
    const eq = pair.indexOf('=')
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
  }
}

function clearCookies() {
  jar.clear()
}

function cookieHeader() {
  return [...jar.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')
}

async function rawRequest(path, options = {}) {
  const url = `${BASE}${path}`
  const headers = { ...(options.headers || {}) }
  const cookie = cookieHeader()
  if (cookie) headers.Cookie = cookie
  const res = await fetch(url, { ...options, headers, redirect: 'manual' })
  parseSetCookie(res.headers)
  return res
}

async function request(path, options = {}) {
  const res = await rawRequest(path, options)
  const text = await res.text().catch(() => '')
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return {
    status: res.status,
    ok: res.ok,
    path,
    text,
    json,
    contentType: res.headers.get('content-type') || '',
  }
}

function record(label, ok, extra = {}) {
  const entry = { label, ok, ...extra }
  results.push(entry)
  if (!ok) failures.push(entry)
  const mark = ok ? 'PASS' : 'FAIL'
  const detail = extra.detail ? ` — ${extra.detail}` : ''
  const status = extra.status ? ` (${extra.status})` : ''
  console.log(`[${mark}] ${label}${status}${detail}`)
}

async function login(email, password, label) {
  const res = await request('/api/staff-users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  record(label, res.status === 200 || res.status === 201, {
    status: res.status,
    detail: !res.ok ? res.text.slice(0, 180) : undefined,
  })
  return res.ok
}

function taskByType(tasks, type) {
  return tasks.find((task) => String(task.type) === type)
}

async function completeTask(task, updates) {
  if (!task) return { skipped: true }
  const res = await request('/api/onboarding/tasks/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId: String(task.id),
      status: 'complete',
      updates,
    }),
  })
  return res
}

async function previewTask(task, updates) {
  if (!task) return { skipped: true }
  return request('/api/portal/onboarding/forms/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId: String(task.id),
      updates,
    }),
  })
}

async function main() {
  console.log(`Onboarding smoke — ${BASE}`)

  clearCookies()
  if (!(await login(ADMIN_EMAIL, ADMIN_PASSWORD, 'POST /api/staff-users/login (admin)'))) {
    process.exit(1)
  }

  const packs = await request('/api/onboarding-packs?where[active][equals]=true&limit=1&depth=0')
  const pack = packs.json?.docs?.[0]
  record('GET /api/onboarding-packs (active)', packs.status === 200 && Boolean(pack), {
    status: packs.status,
    detail: !pack ? 'No active onboarding pack found' : undefined,
  })
  if (!pack) {
    process.exit(1)
  }

  const stamp = Date.now()
  const email = `qa+smoke+${stamp}@example.com`
  const join = await request('/api/onboarding/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packSlug: String(pack.slug),
      email,
      password: TEST_PASSWORD,
      firstName: 'Smoke',
      lastName: `User${String(stamp).slice(-6)}`,
    }),
  })

  const joinedUserId = join.json?.userId ? String(join.json.userId) : null
  const assignmentId = join.json?.assignmentId ? String(join.json.assignmentId) : null
  record('POST /api/onboarding/join', join.status === 200 && Boolean(joinedUserId) && Boolean(assignmentId), {
    status: join.status,
    detail: join.ok ? undefined : join.text.slice(0, 180),
  })
  if (!joinedUserId || !assignmentId) {
    process.exit(1)
  }

  clearCookies()
  if (!(await login(email, TEST_PASSWORD, 'POST /api/staff-users/login (employee)'))) {
    process.exit(1)
  }

  const taskList = await request(`/api/onboarding-tasks?where[user][equals]=${encodeURIComponent(joinedUserId)}&limit=200&depth=0`)
  const tasks = taskList.json?.docs ?? []
  record('GET /api/onboarding-tasks', taskList.status === 200 && tasks.length > 0, {
    status: taskList.status,
    detail: `tasks=${tasks.length}`,
  })
  if (!Array.isArray(tasks) || tasks.length === 0) {
    process.exit(1)
  }

  const generatedDocumentIds = []

  const profileUpdate = await completeTask(taskByType(tasks, 'profile'), {
    dateOfBirth: '1992-06-15',
    mobile: '0400123456',
    addressLine1: '1 Smoke Street',
    suburb: 'Sydney',
    state: 'NSW',
    postcode: '2000',
  })
  if (!profileUpdate.skipped) {
    record('POST /api/onboarding/tasks/update (profile)', profileUpdate.status === 200, {
      status: profileUpdate.status,
    })
  }

  const bankUpdate = await completeTask(taskByType(tasks, 'bank'), {
    bankAccountName: 'Smoke User',
    bankBsb: '062000',
    bankAccountNumber: '12345678',
  })
  if (!bankUpdate.skipped) {
    record('POST /api/onboarding/tasks/update (bank)', bankUpdate.status === 200, {
      status: bankUpdate.status,
    })
  }

  const rtwUpdate = await completeTask(taskByType(tasks, 'rtw'), {
    citizenshipPath: 'australian_citizen',
  })
  if (!rtwUpdate.skipped) {
    record('POST /api/onboarding/tasks/update (rtw)', rtwUpdate.status === 200, {
      status: rtwUpdate.status,
    })
  }

  const fwisUpdate = await completeTask(taskByType(tasks, 'fwis'), {
    fwisAcknowledged: true,
    ceisAcknowledged: true,
  })
  if (!fwisUpdate.skipped) {
    const ids = fwisUpdate.json?.generatedDocumentIds
    if (Array.isArray(ids)) generatedDocumentIds.push(...ids.map(String))
    record('POST /api/onboarding/tasks/update (fwis)', fwisUpdate.status === 200, {
      status: fwisUpdate.status,
      detail: Array.isArray(ids) ? `generated=${ids.length}` : undefined,
    })
  }

  const taxTask = taskByType(tasks, 'tax')
  const taxPreviewUpdates = {
    tfn: '123456782',
    claimTaxFreeThreshold: true,
    hasHelpDebt: false,
    hasSslDebt: false,
    hasTslDebt: false,
    hasVslDebt: false,
    hasSfssDebt: false,
    medicareExemption: 'none',
    residencyStatus: 'australian_resident',
  }
  const taxPreview = await previewTask(taxTask, taxPreviewUpdates)
  if (!taxPreview.skipped) {
    record('POST /api/portal/onboarding/forms/preview (tax)', taxPreview.status === 200, {
      status: taxPreview.status,
    })
  }
  const taxPreviewHashes = Object.fromEntries(
    (taxPreview.json?.previews ?? []).map((preview) => [preview.formId, preview.contentHash]),
  )
  const taxUpdateWithVerification = await completeTask(taxTask, {
    ...taxPreviewUpdates,
    nat3092Verified: true,
    nat3093Verified: true,
    previewContentHashes: taxPreviewHashes,
  })
  if (!taxUpdateWithVerification.skipped) {
    const ids = taxUpdateWithVerification.json?.generatedDocumentIds
    const generatedCount = Array.isArray(ids) ? ids.length : 0
    if (Array.isArray(ids)) generatedDocumentIds.push(...ids.map(String))
    const docFilter = Array.isArray(ids) && ids.length > 0
      ? ids.map((id) => `where[id][in][]=${encodeURIComponent(String(id))}`).join('&')
      : ''
    const generatedTaxDocs = docFilter
      ? await request(`/api/onboarding-documents?${docFilter}&limit=10&depth=0`)
      : { json: { docs: [] } }
    const allFilled = (generatedTaxDocs.json?.docs ?? []).every(
      (doc) => doc?.metadata?.generationMode === 'filled',
    )
    record('POST /api/onboarding/tasks/update (tax)', taxUpdateWithVerification.status === 200, {
      status: taxUpdateWithVerification.status,
      detail: allFilled ? `generated=${generatedCount}; mode=filled` : 'generationMode not filled',
    })
  }

  const superTask = taskByType(tasks, 'super')
  const superPreviewUpdates = {
    superUseDefaultFund: true,
    superUseSmsf: false,
  }
  const superPreview = await previewTask(superTask, superPreviewUpdates)
  if (!superPreview.skipped) {
    record('POST /api/portal/onboarding/forms/preview (super)', superPreview.status === 200, {
      status: superPreview.status,
    })
  }
  const superPreviewHashes = Object.fromEntries(
    (superPreview.json?.previews ?? []).map((preview) => [preview.formId, preview.contentHash]),
  )
  const superUpdate = await completeTask(superTask, {
    ...superPreviewUpdates,
    nat13080Verified: true,
    previewContentHashes: superPreviewHashes,
  })
  if (!superUpdate.skipped) {
    const ids = superUpdate.json?.generatedDocumentIds
    const generatedCount = Array.isArray(ids) ? ids.length : 0
    if (Array.isArray(ids)) generatedDocumentIds.push(...ids.map(String))
    const docFilter = Array.isArray(ids) && ids.length > 0
      ? ids.map((id) => `where[id][in][]=${encodeURIComponent(String(id))}`).join('&')
      : ''
    const generatedSuperDocs = docFilter
      ? await request(`/api/onboarding-documents?${docFilter}&limit=10&depth=0`)
      : { json: { docs: [] } }
    const allFilled = (generatedSuperDocs.json?.docs ?? []).every(
      (doc) => doc?.metadata?.generationMode === 'filled',
    )
    record('POST /api/onboarding/tasks/update (super)', superUpdate.status === 200, {
      status: superUpdate.status,
      detail: Array.isArray(ids) ? (allFilled ? `generated=${generatedCount}; mode=filled` : 'generationMode not filled') : undefined,
    })
  }

  const submit = await request('/api/onboarding/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignmentId }),
  })
  record('POST /api/onboarding/submit', submit.status === 200 || submit.status === 409, {
    status: submit.status,
    detail: submit.status === 409 ? 'already submitted (acceptable)' : undefined,
  })

  const firstDocumentId = generatedDocumentIds[0]
  if (!firstDocumentId) {
    record('generated onboarding documents', false, { detail: 'No generatedDocumentIds returned' })
  } else {
    const downloadRes = await rawRequest(
      `/api/portal/onboarding/documents/download?documentId=${encodeURIComponent(firstDocumentId)}&disposition=attachment`,
      { method: 'GET' },
    )
    const bytes = new Uint8Array(await downloadRes.arrayBuffer())
    const magic = String.fromCharCode(bytes[0] || 0, bytes[1] || 0, bytes[2] || 0, bytes[3] || 0)
    record('GET /api/portal/onboarding/documents/download', downloadRes.status === 200 && magic === '%PDF', {
      status: downloadRes.status,
      detail: `magic=${magic || 'n/a'}`,
    })

    clearCookies()
    const unauthRes = await request(
      `/api/portal/onboarding/documents/download?documentId=${encodeURIComponent(firstDocumentId)}&disposition=attachment`,
      { method: 'GET' },
    )
    record('GET /api/portal/onboarding/documents/download (unauth)', [401, 403].includes(unauthRes.status), {
      status: unauthRes.status,
    })
  }

  clearCookies()
  await login(ADMIN_EMAIL, ADMIN_PASSWORD, 'POST /api/staff-users/login (admin re-login)')
  const queue = await request('/api/onboarding/review/queue')
  const inQueue = Array.isArray(queue.json?.docs)
    ? queue.json.docs.some((item) => String(item.id) === assignmentId || String(item.user) === joinedUserId)
    : false
  record('GET /api/onboarding/review/queue', queue.status === 200 && inQueue, {
    status: queue.status,
    detail: inQueue ? undefined : 'Joined user not found in queue',
  })

  console.log('\nSummary:')
  for (const entry of results) {
    const mark = entry.ok ? 'PASS' : 'FAIL'
    const status = entry.status ? ` (${entry.status})` : ''
    console.log(`- [${mark}] ${entry.label}${status}`)
  }

  if (failures.length > 0) {
    console.log(`\n${failures.length} failure(s) detected.`)
    process.exit(1)
  }
  console.log('\nAll onboarding smoke checks passed.')
}

main().catch((error) => {
  console.error('Onboarding smoke failed with fatal error:')
  console.error(error)
  process.exit(1)
})
