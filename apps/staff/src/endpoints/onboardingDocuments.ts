import type { Endpoint, PayloadHandler } from 'payload'

import { canAccessUserRecord, relationId } from '@/access/roles'
import { actorIdFromUser, requestMeta, writeAuditLog } from '@/lib/audit'
import { isStaffDownloadableOnboardingDocument } from '@/lib/onboarding-documents'
import { readMediaBytes } from '@/lib/media-files'
import { copyOfficialFormBytes } from '@/lib/pdf-form-fill'

export const onboardingDocumentsDownload: Endpoint = {
  path: '/portal/onboarding/documents/download',
  method: 'get',
  handler: (async (req) => {
    if (!req.user) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    const documentId = req.query?.documentId as string | undefined
    if (!documentId) {
      return Response.json({ error: 'invalid_input' }, { status: 400 })
    }

    const document = await req.payload.findByID({
      collection: 'onboarding-documents',
      id: documentId,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (!document) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    const userId = relationId(document.user)
    if (!userId) {
      return Response.json({ error: 'document_missing_user' }, { status: 422 })
    }
    const allowed = await canAccessUserRecord(req, String(userId))
    if (!allowed) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    if (!isStaffDownloadableOnboardingDocument(document)) {
      return Response.json({ error: 'document_pending_signature' }, { status: 403 })
    }

    const mediaId = relationId(document.media)
    if (!mediaId) {
      return Response.json({ error: 'document_missing_media' }, { status: 422 })
    }
    const bytes = await readMediaBytes(req.payload, mediaId)

    const title = String(document.title ?? 'onboarding-document')
    const safeTitle = title.replace(/[^\w\s-]/g, '').trim() || `onboarding-${documentId}`
    const disposition = (req.query?.disposition as string) === 'attachment' ? 'attachment' : 'inline'

    await writeAuditLog(req.payload, {
      actorId: actorIdFromUser(req.user),
      action: 'onboarding.document_download',
      resourceType: 'onboarding-documents',
      resourceId: document.id,
      ...requestMeta(req),
      metadata: { documentId, mediaId },
    })

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${safeTitle}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  }) as PayloadHandler,
}

export const onboardingStatementPdf: Endpoint = {
  path: '/portal/onboarding/statement-pdf',
  method: 'get',
  handler: (async (req) => {
    if (!req.user) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    const statementType = req.query?.type
    const resolvedType = Array.isArray(statementType) ? statementType[0] : statementType
    if (resolvedType !== 'fwis' && resolvedType !== 'ceis') {
      return Response.json({ error: 'invalid_statement_type' }, { status: 400 })
    }

    const copied = await copyOfficialFormBytes(resolvedType)
    const title =
      resolvedType === 'fwis'
        ? 'Fair Work Information Statement'
        : 'Casual Employment Information Statement'
    const fileName = copied.templateVersion.endsWith('.pdf')
      ? copied.templateVersion
      : `${copied.templateVersion}.pdf`

    await writeAuditLog(req.payload, {
      actorId: actorIdFromUser(req.user),
      action: 'onboarding.document_download',
      resourceType: 'onboarding-statement',
      resourceId: resolvedType,
      ...requestMeta(req),
      metadata: { statementType: resolvedType, templateVersion: copied.templateVersion },
    })

    return new Response(Buffer.from(copied.bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Statement-Title': title,
      },
    })
  }) as PayloadHandler,
}
