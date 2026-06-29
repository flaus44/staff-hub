import type { Endpoint, PayloadHandler } from 'payload'
import { z } from 'zod'

import { actorIdFromUser, requestMeta, writeAuditLog } from '@/lib/audit'
import {
  buildSuperDocumentBytes,
  buildTaxDocumentBytes,
  mergeStaffUserForFormFill,
} from '@/lib/onboarding-documents'
import { resolveNat309TitleExport } from '@/lib/onboarding-pdf/field-maps/nat3093-radio-values'
import { relId } from '@/lib/payload-relations'

const previewSchema = z.object({
  taskId: z.union([z.string(), z.number()]),
  updates: z.record(z.string(), z.unknown()).default({}),
})

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

export const onboardingFormsPreview: Endpoint = {
  path: '/portal/onboarding/forms/preview',
  method: 'post',
  handler: (async (req) => {
    if (!req.user) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    let body: z.infer<typeof previewSchema>
    try {
      body = previewSchema.parse(await req.json?.())
    } catch {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const task = await req.payload.findByID({
      collection: 'onboarding-tasks',
      id: body.taskId,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (!task) return Response.json({ error: 'not_found' }, { status: 404 })

    const taskUserId = typeof task.user === 'object' ? task.user?.id : task.user
    if (!taskUserId || String(taskUserId) !== String(req.user.id)) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    if (task.type !== 'tax' && task.type !== 'super') {
      return Response.json({ error: 'unsupported_task_type' }, { status: 400 })
    }

    const fetchedUser = (await req.payload.findByID({
      collection: 'staff-users',
      id: String(req.user.id),
      depth: 0,
      overrideAccess: true,
      req,
    })) as unknown as Record<string, unknown>
    const currentUser = mergeStaffUserForFormFill(fetchedUser, req.user)

    if (task.type === 'tax') {
      const profile = (currentUser.profile as Record<string, unknown> | undefined) ?? {}
      if (!resolveNat309TitleExport(profile.title)) {
        return Response.json({ error: 'title_required' }, { status: 400 })
      }
      if (!profile.dateOfBirth) {
        return Response.json(
          { error: 'profile_incomplete_for_tax', missingFields: ['dateOfBirth'] },
          { status: 400 },
        )
      }
      if (!String(currentUser.email ?? '').trim()) {
        return Response.json({ error: 'email_required' }, { status: 400 })
      }
      const built = await buildTaxDocumentBytes(req.payload, {
        user: currentUser,
        taskUpdates: body.updates,
        staffSignature: null,
        req,
      })
      await writeAuditLog(req.payload, {
        actorId: actorIdFromUser(req.user),
        action: 'onboarding.form_preview',
        resourceType: 'onboarding-tasks',
        resourceId: task.id,
        ...requestMeta(req),
        metadata: {
          taskType: task.type,
          formIds: ['nat3092', 'nat3093'],
          contentHashes: [built.nat3092.contentHash, built.nat3093.contentHash],
        },
      })
      return Response.json({
        previews: [
          {
            formId: built.nat3092.formId,
            title: built.nat3092.title,
            contentHash: built.nat3092.contentHash,
            pdfBase64: toBase64(built.nat3092.bytes),
          },
          {
            formId: built.nat3093.formId,
            title: built.nat3093.title,
            contentHash: built.nat3093.contentHash,
            pdfBase64: toBase64(built.nat3093.bytes),
          },
        ],
      })
    }

    const built = await buildSuperDocumentBytes(req.payload, {
      user: currentUser,
      taskUpdates: body.updates,
      staffSignature: null,
      req,
    })

    await writeAuditLog(req.payload, {
      actorId: actorIdFromUser(req.user),
      action: 'onboarding.form_preview',
      resourceType: 'onboarding-tasks',
      resourceId: task.id,
      ...requestMeta(req),
      metadata: {
        taskType: task.type,
        formIds: ['nat13080'],
        contentHashes: [built.nat13080.contentHash],
      },
    })
    return Response.json({
      previews: [
        {
          formId: built.nat13080.formId,
          title: built.nat13080.title,
          contentHash: built.nat13080.contentHash,
          pdfBase64: toBase64(built.nat13080.bytes),
        },
      ],
    })
  }) as PayloadHandler,
}
