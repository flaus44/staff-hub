import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

type EncryptedBankField = {
  iv: string
  authTag: string
  value: string
}

const ALGO = 'aes-256-gcm'

function encryptionKey(): Buffer {
  const source = process.env.BANK_ENCRYPTION_KEY || process.env.PAYLOAD_SECRET || ''
  if (!source) {
    throw new Error('BANK_ENCRYPTION_KEY is required for bank detail encryption')
  }
  return createHash('sha256').update(source).digest()
}

export function encryptBankField(plain: string): EncryptedBankField {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    value: encrypted.toString('base64'),
  }
}

export function decryptBankField(encrypted: EncryptedBankField): string {
  const decipher = createDecipheriv(ALGO, encryptionKey(), Buffer.from(encrypted.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'))
  const value = Buffer.concat([
    decipher.update(Buffer.from(encrypted.value, 'base64')),
    decipher.final(),
  ])
  return value.toString('utf8')
}

export function maskAccountNumber(input?: string | null): string | undefined {
  if (!input) return undefined
  const trimmed = input.replace(/\s+/g, '')
  if (trimmed.length <= 4) return `***${trimmed}`
  return `${'*'.repeat(trimmed.length - 4)}${trimmed.slice(-4)}`
}
