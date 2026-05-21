// Server-side image preparation for slide analysis, backed by sharp.
//
// Runs on Vercel (sharp ships with the Next.js runtime) — unlike the legacy
// OpenCV/Python path which was skipped in the cloud. Keeping this in one place
// so the synchronous server action (ai-processing.ts) and the async worker
// (api/jobs/worker) prepare images identically and never drift.

import sharp from "sharp"

const SLIDE_TRIM_OPTIONS = {
  background: { r: 255, g: 255, b: 255, alpha: 1 },
  threshold: 24,
} as const

// Footer band where bibliographic citations usually live: bottom 42% of the
// slide, split into left/right halves for higher-resolution OCR by the model.
const FOOTER_BAND_RATIO = 0.42

function buildSlidePipeline(buffer: Buffer, trim = true) {
  let pipeline = sharp(buffer).rotate()
  if (trim) {
    pipeline = pipeline.trim(SLIDE_TRIM_OPTIONS)
  }
  return pipeline
    .modulate({ brightness: 1.04, saturation: 1.06, lightness: 1.01 })
    .sharpen(1.1)
}

export async function renderPreparedDerivative(
  buffer: Buffer,
  width: number,
  height: number,
  format: "jpeg" | "webp",
  quality: number
) {
  const render = async (trim: boolean) => {
    const pipeline = buildSlidePipeline(buffer, trim).resize({
      width,
      height,
      fit: "inside",
      withoutEnlargement: true,
    })

    if (format === "jpeg") {
      return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer({ resolveWithObject: true })
    }

    return pipeline.webp({ quality }).toBuffer({ resolveWithObject: true })
  }

  try {
    return await render(true)
  } catch {
    return await render(false)
  }
}

export interface FooterZooms {
  left?: Buffer
  right?: Buffer
}

// Extract the two footer crops used to help the vision model read small
// citation text. Returns empty object if the image has no readable dimensions.
export async function extractFooterZooms(optimizedBuffer: Buffer): Promise<FooterZooms> {
  const meta = await sharp(optimizedBuffer).metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  if (width <= 0 || height <= 0) return {}

  const halfWidth = Math.max(1, Math.floor(width / 2))
  const cropHeight = Math.max(1, Math.floor(height * FOOTER_BAND_RATIO))
  const cropTop = Math.max(0, height - cropHeight)

  const left = await sharp(optimizedBuffer)
    .extract({ left: 0, top: cropTop, width: halfWidth, height: cropHeight })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer()
  const right = await sharp(optimizedBuffer)
    .extract({ left: halfWidth, top: cropTop, width: Math.max(1, width - halfWidth), height: cropHeight })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer()

  return { left, right }
}
