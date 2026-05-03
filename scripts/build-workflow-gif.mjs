/**
 * Captures the live "Workflow / State Machine" example from the dev site
 * (port 5174) as an animated GIF. Frames are PNGs of the canvas area only;
 * ffmpeg stitches them into the final loop.
 *
 *   node scripts/build-workflow-gif.mjs
 *
 * Output: assets/workflow.gif
 */
import { chromium } from 'playwright-core'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const execFile = promisify(execFileCb)
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const FRAMES_DIR = join(ROOT, '.tmp-workflow-frames')
const OUT = join(ROOT, 'assets', 'workflow.gif')

const FPS = 15
const DURATION_S = 5
const FRAME_COUNT = FPS * DURATION_S

await rm(FRAMES_DIR, { recursive: true, force: true })
await mkdir(FRAMES_DIR, { recursive: true })
await mkdir(dirname(OUT), { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto('http://localhost:5174/examples/workflow', { waitUntil: 'networkidle' })
// Allow fitView + initial reactive paint.
await page.waitForTimeout(800)

const canvas = page.locator('.examples-stage__canvas').first()
const box = await canvas.boundingBox()
if (!box) throw new Error('canvas not found')
console.log('canvas box:', box)

const frameMs = 1000 / FPS
const start = Date.now()
for (let i = 0; i < FRAME_COUNT; i++) {
  const targetTime = start + i * frameMs
  const wait = targetTime - Date.now()
  if (wait > 0) await page.waitForTimeout(wait)
  const png = await page.screenshot({
    clip: { x: box.x, y: box.y, width: box.width, height: box.height },
    type: 'png',
  })
  const idx = String(i).padStart(4, '0')
  await writeFile(join(FRAMES_DIR, `f${idx}.png`), png)
  if (i % 10 === 0) console.log(`  frame ${i + 1}/${FRAME_COUNT}`)
}
await browser.close()
console.log('frames captured')

// Two-pass ffmpeg for a high-quality palette-based GIF.
const palette = join(FRAMES_DIR, 'palette.png')
await execFile('ffmpeg', [
  '-y',
  '-framerate', String(FPS),
  '-i', join(FRAMES_DIR, 'f%04d.png'),
  '-vf', 'scale=900:-1:flags=lanczos,palettegen=stats_mode=diff',
  palette,
])
await execFile('ffmpeg', [
  '-y',
  '-framerate', String(FPS),
  '-i', join(FRAMES_DIR, 'f%04d.png'),
  '-i', palette,
  '-lavfi', 'scale=900:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4',
  '-loop', '0',
  OUT,
])

await rm(FRAMES_DIR, { recursive: true, force: true })
console.log('wrote', OUT)
