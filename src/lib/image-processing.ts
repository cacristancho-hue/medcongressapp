export type SupportedImageMimeType =
  | "image/jpeg"
  | "image/jpg"
  | "image/png"
  | "image/webp"
  | "image/heic"
  | "image/heif"

export interface PreparedImageVariant {
  file: File
  width: number
  height: number
  sizeBytes: number
  mimeType: string
}

export interface PreparedImageResult {
  original: {
    width: number
    height: number
    sizeBytes: number
    mimeType: string
  }
  optimized: PreparedImageVariant
  thumbnail: PreparedImageVariant
  compressionQuality: number
  compressionRatio: number
}

export interface ImageProcessingOptions {
  optimizedMaxWidth?: number
  optimizedMaxHeight?: number
  optimizedMinMajor?: number
  optimizedQuality?: number
  thumbnailMaxWidth?: number
  thumbnailMaxHeight?: number
  thumbnailQuality?: number
}

// Tuned 2026-05-09 for medical congress slides:
// - Gemini 2.5 Flash Vision accepts up to 3072×3072; downscales beyond that.
// - Bibliographic references in slide footers need readable text → high quality.
// - Trade-off: ~1-2 MB per photo (was ~300-500 KB), still well under 20 MB cap.
const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  optimizedMaxWidth: 3072,
  optimizedMaxHeight: 3072,
  optimizedMinMajor: 2200,
  optimizedQuality: 0.92,
  thumbnailMaxWidth: 420,
  thumbnailMaxHeight: 420,
  thumbnailQuality: 0.7,
}

const ALLOWED_MIME_TYPES = new Set<SupportedImageMimeType>([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
])

interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  kind: "bitmap" | "element"
  orientation: number
  cleanup?: () => void
}

function normalizeMimeType(mimeType: string) {
  return mimeType.toLowerCase().trim()
}

function isHeicLike(mimeType: string) {
  return mimeType === "image/heic" || mimeType === "image/heif"
}

function computeTargetDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
  minMajor = 0
) {
  const major = Math.max(width, height)
  const scaleDown = Math.min(1, maxWidth / width, maxHeight / height)
  const targetScale =
    minMajor > 0 && major > minMajor && major * scaleDown < minMajor
      ? minMajor / major
      : scaleDown

  const targetWidth = Math.max(1, Math.round(width * targetScale))
  const targetHeight = Math.max(1, Math.round(height * targetScale))

  return { width: targetWidth, height: targetHeight }
}

async function readExifOrientation(file: File): Promise<number> {
  const mimeType = normalizeMimeType(file.type)
  if (mimeType !== "image/jpeg" && mimeType !== "image/jpg") {
    return 1
  }

  const buffer = await file.slice(0, 65536).arrayBuffer()
  const view = new DataView(buffer)

  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
    return 1
  }

  let offset = 2
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset, false)
    offset += 2

    if (marker === 0xffda || marker === 0xffd9) {
      break
    }

    const segmentLength = view.getUint16(offset, false)
    if (marker === 0xffe1) {
      const exifHeader = view.getUint32(offset + 2, false)
      if (exifHeader !== 0x45786966) {
        return 1
      }

      const tiffOffset = offset + 8
      const littleEndian = view.getUint16(tiffOffset, false) === 0x4949
      const getUint16 = (pos: number) => view.getUint16(pos, littleEndian)
      const getUint32 = (pos: number) => view.getUint32(pos, littleEndian)

      const firstIfdOffset = getUint32(tiffOffset + 4)
      const ifdStart = tiffOffset + firstIfdOffset
      const entries = getUint16(ifdStart)

      for (let i = 0; i < entries; i++) {
        const entryOffset = ifdStart + 2 + i * 12
        const tag = getUint16(entryOffset)
        if (tag === 0x0112) {
          const value = getUint16(entryOffset + 8)
          if (value >= 1 && value <= 8) {
            return value
          }
          return 1
        }
      }

      return 1
    }

    offset += segmentLength
  }

  return 1
}

async function decodeImage(file: File): Promise<DecodedImage> {
  const orientation = await readExifOrientation(file)

  if ("createImageBitmap" in globalThis) {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      } as ImageBitmapOptions)

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        kind: "bitmap",
        orientation,
        cleanup: () => bitmap.close(),
      }
    } catch {
      if (isHeicLike(normalizeMimeType(file.type))) {
        throw new Error(
          "HEIC/HEIF no es compatible en este navegador. Convierte la imagen a JPG, PNG o WEBP."
        )
      }
    }
  }

  const blobUrl = URL.createObjectURL(file)

  try {
    const image = new Image()
    image.decoding = "async"
    image.src = blobUrl
    await image.decode()

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      kind: "element",
      orientation,
      cleanup: () => URL.revokeObjectURL(blobUrl),
    }
  } catch {
    URL.revokeObjectURL(blobUrl)

    if (isHeicLike(normalizeMimeType(file.type))) {
      throw new Error(
        "HEIC/HEIF no es compatible en este navegador. Convierte la imagen a JPG, PNG o WEBP."
      )
    }

    throw new Error("No se pudo decodificar la imagen seleccionada.")
  }
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  preferredMimeType: string,
  quality: number
) {
  const firstAttempt = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, preferredMimeType, quality)
  })

  if (firstAttempt && firstAttempt.type === preferredMimeType) {
    return firstAttempt
  }

  const fallbackMimeType = "image/jpeg"
  if (preferredMimeType === fallbackMimeType) {
    return firstAttempt
  }

  const fallbackAttempt = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, fallbackMimeType, quality)
  })

  return fallbackAttempt
}

async function renderVariant(
  decoded: DecodedImage,
  targetWidth: number,
  targetHeight: number,
  mimeType: "image/jpeg" | "image/webp",
  quality: number
) {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("No se pudo inicializar el lienzo de procesamiento.")
  }

  canvas.width = targetWidth
  canvas.height = targetHeight
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"

  if (decoded.kind === "element" && decoded.orientation !== 1) {
    const swap = decoded.orientation >= 5 && decoded.orientation <= 8
    const sourceWidth = swap ? decoded.height : decoded.width
    const sourceHeight = swap ? decoded.width : decoded.height

    context.save()
    switch (decoded.orientation) {
      case 2:
        context.translate(targetWidth, 0)
        context.scale(-1, 1)
        break
      case 3:
        context.translate(targetWidth, targetHeight)
        context.rotate(Math.PI)
        break
      case 4:
        context.translate(0, targetHeight)
        context.scale(1, -1)
        break
      case 5:
        context.rotate(0.5 * Math.PI)
        context.scale(1, -1)
        context.translate(0, -targetHeight)
        break
      case 6:
        context.rotate(0.5 * Math.PI)
        context.translate(0, -targetHeight)
        break
      case 7:
        context.rotate(0.5 * Math.PI)
        context.translate(targetWidth, -targetHeight)
        context.scale(-1, 1)
        break
      case 8:
        context.rotate(-0.5 * Math.PI)
        context.translate(-targetWidth, 0)
        break
      default:
        break
    }
    context.drawImage(decoded.source, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight)
    context.restore()
  } else {
    context.drawImage(decoded.source, 0, 0, targetWidth, targetHeight)
  }

  const blob = await canvasToBlob(canvas, mimeType, quality)
  if (!blob) {
    throw new Error("No se pudo convertir la imagen procesada.")
  }

  const outputType = blob.type || mimeType
  const fileName = outputType === "image/webp" ? "thumb.webp" : "optimized.jpg"
  return new File([blob], fileName, { type: outputType })
}

function calculateRatio(optimizedBytes: number, originalBytes: number) {
  if (!originalBytes) return 0
  return optimizedBytes / originalBytes
}

export function buildCongressPhotoPaths(
  userId: string,
  congressId: string,
  photoId: string
) {
  return {
    optimized: `${userId}/photos/${congressId}/${photoId}/optimized.jpg`,
    thumbnail: `${userId}/photos/${congressId}/${photoId}/thumb.webp`,
  }
}

export async function prepareCongressPhotoVariants(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<PreparedImageResult> {
  const merged = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const mimeType = normalizeMimeType(file.type)
  if (!ALLOWED_MIME_TYPES.has(mimeType as SupportedImageMimeType)) {
    throw new Error("Formato no compatible. Usa JPG, PNG o WEBP.")
  }

  const decoded = await decodeImage(file)
  try {
    const originalWidth = decoded.width
    const originalHeight = decoded.height
    const originalSize = file.size

    const optimizedTarget = computeTargetDimensions(
      originalWidth,
      originalHeight,
      merged.optimizedMaxWidth,
      merged.optimizedMaxHeight,
      merged.optimizedMinMajor
    )

    const thumbnailTarget = computeTargetDimensions(
      originalWidth,
      originalHeight,
      merged.thumbnailMaxWidth,
      merged.thumbnailMaxHeight
    )

    const optimizedFile = await renderVariant(
      decoded,
      optimizedTarget.width,
      optimizedTarget.height,
      "image/jpeg",
      merged.optimizedQuality
    )

    const thumbnailFile = await renderVariant(
      decoded,
      thumbnailTarget.width,
      thumbnailTarget.height,
      "image/webp",
      merged.thumbnailQuality
    )

    const optimizedSize = optimizedFile.size
    const thumbnailSize = thumbnailFile.size

    return {
      original: {
        width: originalWidth,
        height: originalHeight,
        sizeBytes: originalSize,
        mimeType: file.type,
      },
      optimized: {
        file: optimizedFile,
        width: optimizedTarget.width,
        height: optimizedTarget.height,
        sizeBytes: optimizedSize,
        mimeType: optimizedFile.type,
      },
      thumbnail: {
        file: thumbnailFile,
        width: thumbnailTarget.width,
        height: thumbnailTarget.height,
        sizeBytes: thumbnailSize,
        mimeType: thumbnailFile.type,
      },
      compressionQuality: merged.optimizedQuality,
      compressionRatio: calculateRatio(optimizedSize, originalSize),
    }
  } finally {
    decoded.cleanup?.()
  }
}
