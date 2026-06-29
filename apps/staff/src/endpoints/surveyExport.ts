import type { Endpoint, PayloadHandler } from 'payload'

import { adminOnly } from '@/access/roles'
import { actorIdFromUser, requestMeta, writeAuditLog } from '@/lib/audit'

export const exportSurveyCsv: Endpoint = {
  path: '/portal/surveys/export',
  method: 'get',
  handler: (async (req) => {
    if (!adminOnly({ req })) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    const templateId = req.query?.templateId as string | undefined
    const where = templateId ? { template: { equals: templateId } } : {}

    const responses = await req.payload.find({
      collection: 'survey-responses',
      where,
      limit: 5000,
      depth: 1,
      overrideAccess: true,
    })

    const rows: string[] = []
    rows.push(['responseId', 'template', 'respondent', 'submittedAt', 'answers'].join(','))

    for (const doc of responses.docs) {
      const answers = JSON.stringify(doc.answers ?? {})
      rows.push(
        [
          doc.id,
          typeof doc.template === 'object' ? doc.template?.id : doc.template,
          typeof doc.respondent === 'object' ? doc.respondent?.email : doc.respondent,
          doc.submittedAt,
          `"${answers.replace(/"/g, '""')}"`,
        ].join(','),
      )
    }

    await writeAuditLog(req.payload, {
      actorId: actorIdFromUser(req.user),
      action: 'export.csv',
      resourceType: 'survey-responses',
      ...requestMeta(req),
      metadata: { count: responses.docs.length, templateId },
    })

    return new Response(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="survey-responses.csv"',
      },
    })
  }) as PayloadHandler,
}
