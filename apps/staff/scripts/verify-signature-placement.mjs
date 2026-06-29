import fs from 'node:fs/promises'
import path from 'node:path'

import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'

const OUT_DIR = path.join(process.cwd(), 'tmp', 'signature-spotcheck')
const FORM_DIRS = [
  path.join(process.cwd(), 'assets', 'forms'),
  path.join(process.cwd(), 'apps', 'staff', 'assets', 'forms'),
]

const NAT3092_SIGNATURE = { mode: 'absoluteRect', pageIndex: 4, x: 307, y: 186, width: 142, height: 34 }
const NAT3093_SIGNATURE = {
  mode: 'anchorBox',
  anchorField: 'DecPayee-dateDay',
  box: { dx: -397, dy: -8, width: 150, height: 32 },
}
const NAT13080_SECTION_B_SIGNATURE = {
  mode: 'anchorBox',
  anchorField: 'B-Day',
  box: { dx: -398, dy: 22, width: 150, height: 34 },
}
const NAT13080_SECTION_D_SIGNATURE = {
  mode: 'anchorBox',
  anchorField: 'D-Day',
  box: { dx: -397, dy: 28, width: 150, height: 34 },
}

function sanitizeFileName(input) {
  return input.replace(/[^\w.-]+/g, '_')
}

async function resolveFormPath(fileName) {
  for (const dir of FORM_DIRS) {
    const candidate = path.join(dir, fileName)
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // try next location
    }
  }
  throw new Error(`Missing form template: ${fileName}`)
}

async function makeSampleSignaturePng() {
  const svg = `
    <svg width="560" height="160" viewBox="0 0 560 160" xmlns="http://www.w3.org/2000/svg">
      <rect width="560" height="160" fill="white"/>
      <path d="M20 110 C 80 30, 130 140, 185 85 C 220 50, 255 118, 300 78 C 344 40, 395 127, 435 82 C 462 57, 500 102, 540 70"
            fill="none" stroke="#1f2937" stroke-width="7" stroke-linecap="round"/>
      <text x="24" y="145" font-family="Arial" font-size="22" fill="#334155">Spot-check Signature</text>
    </svg>
  `
  return sharp(Buffer.from(svg)).png().toBuffer()
}

function computeAnchorBox(pdf, placement) {
  const form = pdf.getForm()
  const field = form.getTextField(placement.anchorField)
  const widget = field.acroField.getWidgets()[0]
  if (!widget) return null
  const rect = widget.getRectangle()
  const pageIndex = pdf.getPages().findIndex((page) => page.ref === widget.P())
  if (pageIndex < 0) return null
  return {
    pageIndex,
    x: rect.x + placement.box.dx,
    y: rect.y + placement.box.dy,
    width: placement.box.width,
    height: placement.box.height,
  }
}

function drawImageInBox(page, image, box) {
  const padding = 2
  const minHeight = 28
  const dims = image.scale(1)
  const innerWidth = Math.max(1, box.width - padding * 2)
  const innerHeight = Math.max(1, box.height - padding * 2)
  const fitScale = Math.min(innerWidth / dims.width, innerHeight / dims.height)
  const minHeightScale = minHeight / dims.height
  const scale = innerHeight >= minHeight ? Math.max(fitScale, minHeightScale) : fitScale
  page.drawImage(image, {
    x: box.x + padding,
    y: box.y + padding,
    width: dims.width * scale,
    height: dims.height * scale,
  })
}

async function writeSpotcheck(args) {
  const templatePath = await resolveFormPath(args.template)
  const pdfBytes = await fs.readFile(templatePath)
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const sig = await pdf.embedPng(args.signaturePng)
  for (const placement of args.placements) {
    const box = placement.mode === 'absoluteRect' ? placement : computeAnchorBox(pdf, placement)
    if (!box) continue
    drawImageInBox(pdf.getPage(box.pageIndex), sig, box)
  }
  const bytes = await pdf.save()
  const target = path.join(OUT_DIR, sanitizeFileName(args.outFile))
  await fs.writeFile(target, bytes)
  console.log(`wrote ${path.relative(process.cwd(), target)}`)
}

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const signaturePng = await makeSampleSignaturePng()

  await writeSpotcheck({
    template: 'NAT3092-06.2019.pdf',
    outFile: 'nat3092-signature.pdf',
    placements: [NAT3092_SIGNATURE],
    signaturePng,
  })

  await writeSpotcheck({
    template: 'NAT3093-current.pdf',
    outFile: 'nat3093-signature.pdf',
    placements: [NAT3093_SIGNATURE],
    signaturePng,
  })

  await writeSpotcheck({
    template: 'NAT13080-2023-04.pdf',
    outFile: 'nat13080-existing-signature.pdf',
    placements: [NAT13080_SECTION_B_SIGNATURE],
    signaturePng,
  })

  await writeSpotcheck({
    template: 'NAT13080-2023-04.pdf',
    outFile: 'nat13080-default-signature.pdf',
    placements: [NAT13080_SECTION_B_SIGNATURE],
    signaturePng,
  })

  await writeSpotcheck({
    template: 'NAT13080-2023-04.pdf',
    outFile: 'nat13080-smsf-signature.pdf',
    placements: [NAT13080_SECTION_B_SIGNATURE, NAT13080_SECTION_D_SIGNATURE],
    signaturePng,
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
