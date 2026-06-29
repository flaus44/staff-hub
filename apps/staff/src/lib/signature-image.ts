import type { PDFImage, PDFPage } from 'pdf-lib'

const MIN_ALPHA = 10
const MAX_BACKGROUND_LUMA = 248

export type SignatureBox = {
  x: number
  y: number
  width: number
  height: number
}

type TrimBounds = {
  left: number
  top: number
  right: number
  bottom: number
}

function normalizeDataUrl(raw: string): string {
  if (!raw) return ''
  return raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`
}

function splitPngDataUrl(raw: string): { base64: string } {
  const normalized = normalizeDataUrl(raw)
  const [, base64 = ''] = normalized.split(',', 2)
  return { base64 }
}

function shouldKeepPixel(alpha: number, red: number, green: number, blue: number): boolean {
  if (alpha <= MIN_ALPHA) return false
  const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue
  return luma <= MAX_BACKGROUND_LUMA
}

function encodePngDataUrl(bytes: Uint8Array): string {
  return `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`
}

function trimRgbaBounds(rgba: Uint8Array | Uint8ClampedArray, width: number, height: number): TrimBounds | null {
  let left = width
  let right = -1
  let top = height
  let bottom = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const red = rgba[idx]
      const green = rgba[idx + 1]
      const blue = rgba[idx + 2]
      const alpha = rgba[idx + 3]
      if (!shouldKeepPixel(alpha, red, green, blue)) continue
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }

  if (right < left || bottom < top) return null
  return { left, top, right, bottom }
}

async function trimWithSharp(dataUrl: string): Promise<string> {
  const { base64 } = splitPngDataUrl(dataUrl)
  if (!base64) return normalizeDataUrl(dataUrl)

  const sharp = (await import('sharp')).default
  const source = Buffer.from(base64, 'base64')
  const image = sharp(source, { failOn: 'none' }).ensureAlpha()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const bounds = trimRgbaBounds(data, info.width, info.height)
  if (!bounds) return normalizeDataUrl(dataUrl)

  const left = Math.max(0, bounds.left - 1)
  const top = Math.max(0, bounds.top - 1)
  const width = Math.min(info.width - left, bounds.right - bounds.left + 3)
  const height = Math.min(info.height - top, bounds.bottom - bounds.top + 3)

  const trimmed = await sharp(source, { failOn: 'none' })
    .extract({
      left,
      top,
      width: Math.max(1, width),
      height: Math.max(1, height),
    })
    .png()
    .toBuffer()

  return encodePngDataUrl(trimmed)
}

async function trimInBrowser(dataUrl: string): Promise<string> {
  const normalized = normalizeDataUrl(dataUrl)
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth || image.width
      canvas.height = image.naturalHeight || image.height
      const ctx = canvas.getContext('2d')
      if (!ctx || canvas.width === 0 || canvas.height === 0) {
        resolve(normalized)
        return
      }
      ctx.drawImage(image, 0, 0)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const bounds = trimRgbaBounds(data, canvas.width, canvas.height)
      if (!bounds) {
        resolve(normalized)
        return
      }

      const out = document.createElement('canvas')
      const width = Math.max(1, bounds.right - bounds.left + 3)
      const height = Math.max(1, bounds.bottom - bounds.top + 3)
      out.width = width
      out.height = height
      const outCtx = out.getContext('2d')
      if (!outCtx) {
        resolve(normalized)
        return
      }
      outCtx.drawImage(
        canvas,
        Math.max(0, bounds.left - 1),
        Math.max(0, bounds.top - 1),
        width,
        height,
        0,
        0,
        width,
        height,
      )
      resolve(out.toDataURL('image/png'))
    }
    image.onerror = () => resolve(normalized)
    image.src = normalized
  })
}

export async function trimSignaturePng(dataUrl: string): Promise<string> {
  const normalized = normalizeDataUrl(dataUrl)
  if (!normalized) return ''
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return trimInBrowser(normalized)
  }
  return trimWithSharp(normalized)
}

export function drawSignatureInBox(
  page: PDFPage,
  image: PDFImage,
  box: SignatureBox,
  opts: { minHeight?: number; padding?: number } = {},
): void {
  const minHeight = opts.minHeight ?? 28
  const padding = opts.padding ?? 2
  const source = image.scale(1)
  const innerWidth = Math.max(1, box.width - padding * 2)
  const innerHeight = Math.max(1, box.height - padding * 2)
  const fitScale = Math.min(innerWidth / source.width, innerHeight / source.height)
  const minHeightScale = minHeight / source.height
  const scale = innerHeight >= minHeight ? Math.max(fitScale, minHeightScale) : fitScale
  page.drawImage(image, {
    x: box.x + padding,
    y: box.y + padding,
    width: source.width * scale,
    height: source.height * scale,
  })
}

export function expandSignatureBox(
  box: SignatureBox,
  opts: { minWidth?: number; minHeight?: number } = {},
): SignatureBox {
  const minWidth = opts.minWidth ?? 130
  const minHeight = opts.minHeight ?? 35
  const width = Math.max(box.width, minWidth)
  const height = Math.max(box.height, minHeight)
  return {
    x: box.x - (width - box.width) / 2,
    y: box.y - (height - box.height) / 2,
    width,
    height,
  }
}
