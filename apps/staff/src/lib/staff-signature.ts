import type { Payload, PayloadRequest } from 'payload'

import type { DiditDecision } from '@/lib/didit'
import { readMediaBytes } from '@/lib/media-files'
import { relId } from '@/lib/payload-relations'
import { trimSignaturePng } from '@/lib/signature-image'

export type StaffSignatureSource = {
  id: string
  dataUrl: string
  signerName: string
  signatureMethod: 'draw' | 'type' | null
  signedAt: string | null
  diditSessionId: string | null
}

function isApprovedDiditVerification(didit: unknown): boolean {
  if (!didit || typeof didit !== 'object') return false
  const status = String((didit as DiditDecision).status ?? '').toLowerCase()
  return status === 'approved' || status === 'verified'
}

function parseSignatureDataUrl(raw: string): string {
  if (raw.startsWith('data:')) return raw
  return `data:image/png;base64,${raw}`
}

function signerNameFromRecord(record: Record<string, unknown>): string {
  const first = String(record.firstName ?? '').trim()
  const last = String(record.lastName ?? '').trim()
  const full = `${first} ${last}`.trim()
  if (full) return full
  const didit = record.diditVerification as DiditDecision | null | undefined
  if (didit?.verifiedName) return didit.verifiedName
  return ''
}

/** Inline signature from the active contract sign request (before DB persistence). */
export async function staffSignatureFromSignRequest(args: {
  dataUrl: string
  signerName: string
  signedAt: Date
  signatureMethod?: 'draw' | 'type'
}): Promise<StaffSignatureSource> {
  return {
    id: 'inline',
    dataUrl: await trimSignaturePng(parseSignatureDataUrl(args.dataUrl)),
    signerName: args.signerName,
    signatureMethod: args.signatureMethod ?? null,
    signedAt: args.signedAt.toISOString(),
    diditSessionId: null,
  }
}

/**
 * Returns the PNG signature captured during contract signing when the signer
 * completed an approved Didit identity verification. Didit itself does not
 * provide a handwritten signature — only liveness/selfie metadata in
 * `diditVerification`.
 */
export async function resolveStaffContractSignature(
  payload: Payload,
  args: {
    userId: string | number
    req?: PayloadRequest
    /** When true, return latest signature PNG even without approved Didit (backfill). */
    allowWithoutDidit?: boolean
  },
): Promise<StaffSignatureSource | null> {
  const signatures = await payload.find({
    collection: 'contract-signatures',
    where: { user: { equals: args.userId } },
    sort: '-signedAt',
    limit: 20,
    depth: 1,
    overrideAccess: true,
    req: args.req,
  })

  for (const doc of signatures.docs as Array<Record<string, unknown>>) {
    if (!args.allowWithoutDidit && !isApprovedDiditVerification(doc.diditVerification)) continue

    const signatureImageId = relId(doc.signatureImage)
    if (!signatureImageId) continue

    try {
      const bytes = await readMediaBytes(payload, signatureImageId)
      const user = typeof doc.user === 'object' && doc.user !== null ? (doc.user as Record<string, unknown>) : null
      const signerName =
        signerNameFromRecord(user ?? {}) ||
        String((doc.diditVerification as DiditDecision | null)?.verifiedName ?? '').trim() ||
        'Signer'

      return {
        id: String(doc.id),
        dataUrl: await trimSignaturePng(
          parseSignatureDataUrl(Buffer.from(bytes).toString('base64')),
        ),
        signerName,
        signatureMethod:
          doc.signatureMethod === 'draw' || doc.signatureMethod === 'type' ? doc.signatureMethod : null,
        signedAt: doc.signedAt ? String(doc.signedAt) : null,
        diditSessionId: doc.diditSessionId ? String(doc.diditSessionId) : null,
      }
    } catch {
      continue
    }
  }

  return null
}
