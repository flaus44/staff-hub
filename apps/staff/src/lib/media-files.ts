import fs from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'

type MediaDoc = {
  id: number | string
  url?: string | null
  filename?: string | null
  mimeType?: string | null
}

export async function readMediaBytes(payload: Payload, mediaId: number | string): Promise<Uint8Array> {
  const doc = (await payload.findByID({
    collection: 'media',
    id: mediaId,
    overrideAccess: true,
    depth: 0,
  })) as MediaDoc | null

  if (!doc?.filename) {
    throw new Error(`Media file not found: ${mediaId}`)
  }

  const candidates = [
    path.join(process.cwd(), 'media', doc.filename),
    path.join(process.cwd(), 'apps', 'staff', 'media', doc.filename),
  ]

  for (const filePath of candidates) {
    try {
      const buffer = await fs.readFile(filePath)
      return new Uint8Array(buffer)
    } catch {
      // try next path
    }
  }

  if (doc.url) {
    const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const url = doc.url.startsWith('http') ? doc.url : `${base}${doc.url}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch media ${mediaId}`)
    return new Uint8Array(await res.arrayBuffer())
  }

  throw new Error(`Could not read media file: ${doc.filename}`)
}

export function mediaLabel(doc: MediaDoc, index: number): string {
  return doc.filename?.replace(/\.pdf$/i, '') || `Document ${index + 1}`
}

export type ContractDocumentPreview = {
  id: string
  label: string
  url?: string | null
}

export function resolveContractDocumentPreviews(contract: {
  documentPdfs?: (MediaDoc | number | string)[] | null
  templatePdf?: MediaDoc | number | string | null
}): ContractDocumentPreview[] {
  const fromMany = contract.documentPdfs ?? []
  if (fromMany.length > 0) {
    return fromMany
      .map((item, index) => {
        if (typeof item !== 'object' || item === null) return null
        return {
          id: String(item.id),
          label: mediaLabel(item, index),
          url: item.url ?? null,
        }
      })
      .filter((item): item is ContractDocumentPreview => item !== null)
  }

  if (contract.templatePdf && typeof contract.templatePdf === 'object') {
    return [
      {
        id: String(contract.templatePdf.id),
        label: mediaLabel(contract.templatePdf, 0),
        url: contract.templatePdf.url ?? null,
      },
    ]
  }

  return []
}
