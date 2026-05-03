/**
 * Renders public/favicon.svg → public/favicon.ico (PNG-embedded ICO with two
 * sizes: 32×32 and 64×64). Run: node scripts/build-favicon.mjs
 */
import { chromium } from 'playwright-core'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '..', 'packages', 'website', 'public')

async function svgToPng(svgString, size) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  const html = `<!doctype html><html><head><style>
    html, body { margin: 0; padding: 0; background: transparent; }
    svg { display: block; width: ${size}px; height: ${size}px; }
  </style></head><body>${svgString}</body></html>`
  await page.setContent(html)
  const png = await page.locator('svg').screenshot({ omitBackground: true, type: 'png' })
  await browser.close()
  return png
}

/**
 * Pack PNG buffers into a Vista-style ICO (PNG-embedded entries).
 * Spec: https://en.wikipedia.org/wiki/ICO_(file_format)
 */
function buildIco(images) {
  const headerSize = 6
  const dirEntrySize = 16
  const dirSize = images.length * dirEntrySize
  let offset = headerSize + dirSize
  const buffers = []

  // ICONDIR (6 bytes)
  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)            // reserved
  header.writeUInt16LE(1, 2)            // type: 1 = .ico
  header.writeUInt16LE(images.length, 4) // image count
  buffers.push(header)

  // ICONDIRENTRY × N (16 bytes each)
  for (const { size, png } of images) {
    const entry = Buffer.alloc(dirEntrySize)
    entry.writeUInt8(size === 256 ? 0 : size, 0) // width (0 = 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1) // height
    entry.writeUInt8(0, 2)                       // palette
    entry.writeUInt8(0, 3)                       // reserved
    entry.writeUInt16LE(1, 4)                    // color planes
    entry.writeUInt16LE(32, 6)                   // bits per pixel
    entry.writeUInt32LE(png.length, 8)           // image size
    entry.writeUInt32LE(offset, 12)              // offset
    buffers.push(entry)
    offset += png.length
  }
  for (const { png } of images) buffers.push(png)
  return Buffer.concat(buffers)
}

const svg = await readFile(join(PUBLIC_DIR, 'favicon.svg'), 'utf8')
const sizes = [16, 32, 48, 64]
const images = []
for (const size of sizes) {
  const png = await svgToPng(svg, size)
  images.push({ size, png })
  console.log(`rendered ${size}×${size} (${png.length} bytes)`)
}
const ico = buildIco(images)
await writeFile(join(PUBLIC_DIR, 'favicon.ico'), ico)
console.log(`wrote favicon.ico (${ico.length} bytes)`)
