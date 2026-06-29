import { createHash } from 'node:crypto'

import type { Endpoint, PayloadHandler } from 'payload'

import { actorIdFromUser, requestMeta, writeAuditLog } from '@/lib/audit'
import { relId, relIdNumber } from '@/lib/payload-relations'

const COMPLIANCE_LETTER_PATH = '/portal/onboarding/super/compliance-letter'
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

function relationId(value: unknown): string | null {
  return relId(value)
}

async function loadSuperTaskForUser(
  req: Parameters<PayloadHandler>[0],
  taskId: string,
) {
  const task = await req.payload.findByID({
    collection: 'onboarding-tasks',
    id: taskId,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (!task) return { error: Response.json({ error: 'not_found' }, { status: 404 }) }

  const taskUserId = relationId(task.user)
  if (!taskUserId || taskUserId !== String(req.user!.id)) {
    return { error: Response.json({ error: 'forbidden' }, { status: 403 }) }
  }
  if (task.type !== 'super') {
    return { error: Response.json({ error: 'unsupported_task_type' }, { status: 400 }) }
  }

  return { task }
}

async function markDocumentSuperseded(
  req: Parameters<PayloadHandler>[0],
  documentId: string,
) {
  const existing = await req.payload.findByID({
    collection: 'onboarding-documents',
    id: documentId,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (!existing) return

  const metadata =
    existing.metadata && typeof existing.metadata === 'object'
      ? (existing.metadata as Record<string, unknown>)
      : {}

  await req.payload.update({
    collection: 'onboarding-documents',
    id: documentId,
    data: {
      metadata: {
        ...metadata,
        supersededAt: new Date().toISOString(),
        supersededBy: 'reupload_or_removal',
      },
    },
    overrideAccess: true,
    req,
  })
}

async function clearComplianceLetter(
  req: Parameters<PayloadHandler>[0],
  userId: string,
) {
  const user = (await req.payload.findByID({
    collection: 'staff-users',
    id: userId,
    depth: 0,
    overrideAccess: true,
    req,
  })) as Record<string, unknown>

  const existingDocumentId = relationId(user.superComplianceLetterDocument)
  if (existingDocumentId) {
    await markDocumentSuperseded(req, existingDocumentId)
  }

  await req.payload.update({
    collection: 'staff-users',
    id: userId,
    data: {
      superComplianceLetter: null,
      superComplianceLetterDocument: null,
    },
    overrideAccess: true,
    req,
  })
}

const uploadHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ error: 'unauthorised' }, { status: 401 })
  }

  const formData = await req.formData?.()
  if (!formData) {
    return Response.json({ error: 'invalid_input' }, { status: 400 })
  }

  const taskId = String(formData.get('taskId') ?? '').trim()
  if (!taskId) {
    return Response.json({ error: 'invalid_input' }, { status: 400 })
  }

  const loaded = await loadSuperTaskForUser(req, taskId)
  if ('error' in loaded && loaded.error) return loaded.error
  const { task } = loaded

  const fileEntry = formData.get('file')
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return Response.json({ error: 'file_required' }, { status: 400 })
  }
  if (fileEntry.size > MAX_FILE_BYTES) {
    return Response.json({ error: 'file_too_large' }, { status: 400 })
  }

  const mimeType = fileEntry.type || 'application/octet-stream'
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return Response.json({ error: 'invalid_file_type' }, { status: 400 })
  }

  const userId = String(req.user.id)
  const currentUser = (await req.payload.findByID({
    collection: 'staff-users',
    id: userId,
    depth: 0,
    overrideAccess: true,
    req,
  })) as Record<string, unknown>

  const existingDocumentId = relationId(currentUser.superComplianceLetterDocument)
  if (existingDocumentId) {
    await markDocumentSuperseded(req, existingDocumentId)
  }

  const fileBuffer = Buffer.from(await fileEntry.arrayBuffer())
  const fileName = fileEntry.name.trim() || 'super-compliance-letter'
  const contentSha256 = createHash('sha256').update(fileBuffer).digest('hex')
  const uploadedAt = new Date().toISOString()

  const media = await req.payload.create({
    collection: 'media',
    data: {
      alt: 'Super fund letter of compliance',
      classification: 'onboarding_pii',
    },
    file: {
      data: fileBuffer,
      mimetype: mimeType,
      name: fileName,
      size: fileBuffer.length,
    },
    req,
  })

  const document = await req.payload.create({
    collection: 'onboarding-documents',
    data: {
      user: relIdNumber(userId),
      assignment: relIdNumber(task.assignment),
      task: relIdNumber(task.id),
      title: 'Super fund letter of compliance',
      documentType: 'compliance',
      media: relIdNumber(media.id),
      issuedAt: uploadedAt,
      metadata: {
        contentSha256,
        uploadedAt,
        originalFileName: fileName,
        mimeType,
      },
    },
    overrideAccess: true,
    req,
  })

  await req.payload.update({
    collection: 'staff-users',
    id: userId,
    data: {
      superComplianceLetter: media.id,
      superComplianceLetterDocument: document.id,
    },
    overrideAccess: true,
    req,
  })

  await writeAuditLog(req.payload, {
    actorId: actorIdFromUser(req.user),
    action: 'onboarding.super_compliance_upload',
    resourceType: 'onboarding-documents',
    resourceId: document.id,
    ...requestMeta(req),
    metadata: {
      taskId: task.id,
      mediaId: media.id,
      fileName,
      contentSha256,
    },
  })

  return Response.json({
    mediaId: String(media.id),
    documentId: String(document.id),
    fileName,
  })
}

const deleteHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ error: 'unauthorised' }, { status: 401 })
  }

  let taskId = ''
  const queryTaskId = req.query?.taskId
  if (typeof queryTaskId === 'string') {
    taskId = queryTaskId.trim()
  } else if (Array.isArray(queryTaskId) && typeof queryTaskId[0] === 'string') {
    taskId = queryTaskId[0].trim()
  }

  if (!taskId) {
    try {
      const body = (await req.json?.()) as { taskId?: string | number } | undefined
      taskId = String(body?.taskId ?? '').trim()
    } catch {
      taskId = ''
    }
  }

  if (!taskId) {
    return Response.json({ error: 'invalid_input' }, { status: 400 })
  }

  const loaded = await loadSuperTaskForUser(req, taskId)
  if ('error' in loaded && loaded.error) return loaded.error

  const userId = String(req.user.id)
  await clearComplianceLetter(req, userId)

  await writeAuditLog(req.payload, {
    actorId: actorIdFromUser(req.user),
    action: 'onboarding.super_compliance_delete',
    resourceType: 'staff-users',
    resourceId: userId,
    ...requestMeta(req),
    metadata: { taskId },
  })

  return Response.json({ ok: true })
}

export const onboardingSuperComplianceUpload: Endpoint = {
  path: COMPLIANCE_LETTER_PATH,
  method: 'post',
  handler: uploadHandler,
}

export const onboardingSuperComplianceDelete: Endpoint = {
  path: COMPLIANCE_LETTER_PATH,
  method: 'delete',
  handler: deleteHandler,
}
