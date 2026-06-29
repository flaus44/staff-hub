import type { Payload, PayloadRequest } from 'payload'

const DELETE_BATCH = 200

async function deleteWhere(
  payload: Payload,
  collection: Parameters<Payload['find']>[0]['collection'],
  where: NonNullable<Parameters<Payload['find']>[0]['where']>,
  req?: PayloadRequest,
) {
  let page = 1
  while (true) {
    const result = await payload.find({
      collection,
      where,
      limit: DELETE_BATCH,
      page,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (result.docs.length === 0) break

    for (const doc of result.docs) {
      await payload.delete({
        collection,
        id: doc.id,
        overrideAccess: true,
        req,
      })
    }

    if (!result.hasNextPage) break
    page += 1
  }
}

async function clearRelation(
  payload: Payload,
  collection: Parameters<Payload['find']>[0]['collection'],
  field: string,
  userId: number,
  req?: PayloadRequest,
) {
  let page = 1
  while (true) {
    const result = await payload.find({
      collection,
      where: { [field]: { equals: userId } },
      limit: DELETE_BATCH,
      page,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (result.docs.length === 0) break

    for (const doc of result.docs) {
      await payload.update({
        collection,
        id: doc.id,
        data: { [field]: null },
        overrideAccess: true,
        req,
      })
    }

    if (!result.hasNextPage) break
    page += 1
  }
}

export async function deleteStaffUserDependents(
  payload: Payload,
  userId: string | number,
  req?: PayloadRequest,
) {
  const id = Number(userId)
  if (!Number.isFinite(id)) return

  await clearRelation(payload, 'onboarding-assignments', 'manager', id, req)
  await clearRelation(payload, 'onboarding-assignments', 'reviewer', id, req)
  await clearRelation(payload, 'onboarding-tasks', 'completedBy', id, req)
  await clearRelation(payload, 'onboarding-tasks', 'reviewedBy', id, req)
  await clearRelation(payload, 'time-entries', 'approvedBy', id, req)
  await clearRelation(payload, 'audit-log', 'actor', id, req)

  const userFilter = { user: { equals: id } }
  const assigneeFilter = { assignee: { equals: id } }
  const actorFilter = { actor: { equals: id } }

  await deleteWhere(payload, 'onboarding-tasks', userFilter, req)
  await deleteWhere(payload, 'onboarding-documents', userFilter, req)
  await deleteWhere(payload, 'onboarding-events', userFilter, req)
  await deleteWhere(payload, 'onboarding-events', actorFilter, req)
  await deleteWhere(payload, 'onboarding-overrides', userFilter, req)
  await deleteWhere(payload, 'onboarding-overrides', { grantedBy: { equals: id } }, req)
  await deleteWhere(payload, 'onboarding-assignments', userFilter, req)

  await deleteWhere(payload, 'survey-responses', { respondent: { equals: id } }, req)
  await deleteWhere(payload, 'survey-assignments', assigneeFilter, req)
  await deleteWhere(payload, 'training-completions', { user: { equals: id } }, req)
  await deleteWhere(payload, 'contract-signatures', { user: { equals: id } }, req)
  await deleteWhere(payload, 'contract-signing-drafts', { user: { equals: id } }, req)
  await deleteWhere(payload, 'time-entry-corrections', { correctedBy: { equals: id } }, req)

  const timeEntries = await payload.find({
    collection: 'time-entries',
    where: userFilter,
    limit: DELETE_BATCH,
    depth: 0,
    overrideAccess: true,
    req,
  })

  for (const entry of timeEntries.docs) {
    await deleteWhere(payload, 'shift-notes', { timeEntry: { equals: entry.id } }, req)
  }

  await deleteWhere(payload, 'time-entries', userFilter, req)
  await deleteWhere(payload, 'incidents', { reporter: { equals: id } }, req)

  const directReports = await payload.find({
    collection: 'staff-users',
    where: { manager: { equals: id } },
    limit: DELETE_BATCH,
    depth: 0,
    overrideAccess: true,
    req,
  })

  for (const report of directReports.docs) {
    await payload.update({
      collection: 'staff-users',
      id: report.id,
      data: { manager: null },
      overrideAccess: true,
      req,
    })
  }

  await deleteWhere(payload, 'invite-tokens', { manager: { equals: id } }, req)
}
