import { createHash } from 'node:crypto'

export function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}

export const E_SIGN_CONSENT_TEXT =
  'I agree to electronically sign this document and understand that my electronic signature is legally binding under the Electronic Transactions Act 1999 (Cth).'

export const E_SIGN_CONSENT_VERSION = '2026-06-01'
