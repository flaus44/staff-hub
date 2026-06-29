import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

type EncryptedTfn = {
  iv: string
  authTag: string
  value: string
}

const ALGO = 'aes-256-gcm'

function encryptionKey(): Buffer {
  const source = process.env.TFN_ENCRYPTION_KEY || process.env.PAYLOAD_SECRET || ''
  if (!source) {
    throw new Error('TFN_ENCRYPTION_KEY is required for TFN encryption')
  }
  return createHash('sha256').update(source).digest()
}

function normaliseTfn(input: string): string {
  return input.replace(/\s+/g, '')
}

export function encryptTfn(plain: string): EncryptedTfn {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(normaliseTfn(plain), 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    value: encrypted.toString('base64'),
  }
}

export function decryptTfn(encrypted: EncryptedTfn): string {
  const decipher = createDecipheriv(ALGO, encryptionKey(), Buffer.from(encrypted.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'))
  const value = Buffer.concat([
    decipher.update(Buffer.from(encrypted.value, 'base64')),
    decipher.final(),
  ])
  return value.toString('utf8')
}

export function maskTfn(input?: string | null): string | undefined {
  if (!input) return undefined
  const digits = normaliseTfn(input)
  if (digits.length <= 3) return `***${digits}`
  return `${'*'.repeat(Math.max(0, digits.length - 3))}${digits.slice(-3)}`
}
