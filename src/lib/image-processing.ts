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

export interface PreparedThumbnailResult {
  original: {
    width: number
    height: number
    sizeBytes: number
    mimeType: string
  }
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

interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

function normalizeMimeType(mimeType: string) {
  return mimeType.toLowerCase().trim()
}

function isHeicLike(mimeType: string) {
  return mimeType === "image/heic" || mimeType === "image/heif"
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function smoothSeries(values: Float32Array, windowSize = 5) {
  const half = Math.floor(windowSize / 2)
  const output = new Float32Array(values.length)

  for (let i = 0; i < values.length; i++) {
    let total = 0
    let count = 0
    for (let j = -half; j <= half; j++) {
      const idx = i + j
      if (idx < 0 || idx >= values.length) continue
      total += values[idx]
      count++
    }
    output[i] = count > 0 ? total / count : values[i]
  }

  return output
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

function pickOptimizedQuality(areaRatio: number, major: number) {
  if (areaRatio < 0.45) return 0.86
  if (areaRatio < 0.7) return 0.89
  if (major > 2800) return 0.92
  return 0.9
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
        throw new Error("HEIC/HEIF no es compatible en este navegador. Convierte la imagen a JPG, PNG o WEBP.")
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
      throw new Error("HEIC/HEIF no es compatible en este navegador. Convierte la imagen a JPG, PNG o WEBP.")
    }

    throw new Error("No se pudo decodificar la imagen seleccionada.")
  }
}

function detectSlideCropRect(decoded: DecodedImage): CropRect | null {
  if (decoded.kind !== "bitmap") return null

  const analysisMax = 1280
  const scale = Math.min(1, analysisMax / Math.max(decoded.width, decoded.height))
  const analysisWidth = Math.max(1, Math.round(decoded.width * scale))
  const analysisHeight = Math.max(1, Math.round(decoded.height * scale))

  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) return null

  canvas.width = analysisWidth
  canvas.height = analysisHeight
  context.drawImage(
    decoded.source,
    0,
    0,
    decoded.width,
    decoded.height,
    0,
    0,
    analysisWidth,
    analysisHeight
  )

  const { data } = context.getImageData(0, 0, analysisWidth, analysisHeight)
  const rowEnergy = new Float32Array(analysisHeight)
  const colEnergy = new Float32Array(analysisWidth)

  for (let y = 0; y < analysisHeight - 1; y++) {
    for (let x = 0; x < analysisWidth - 1; x++) {
      const index = (y * analysisWidth + x) * 4
      const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114
      const rightIndex = index + 4
      const downIndex = index + analysisWidth * 4
      const grayRight =
        data[rightIndex] * 0.299 + data[rightIndex + 1] * 0.587 + data[rightIndex + 2] * 0.114
      const grayDown =
        data[downIndex] * 0.299 + data[downIndex + 1] * 0.587 + data[downIndex + 2] * 0.114
      const energy = Math.abs(gray - grayRight) + Math.abs(gray - grayDown)
      rowEnergy[y] += energy
      colEnergy[x] += energy
    }
  }

  const smoothRows = smoothSeries(rowEnergy)
  const smoothCols = smoothSeries(colEnergy)
  const maxRow = Math.max(...smoothRows)
  const maxCol = Math.max(...smoothCols)
  if (!maxRow || !maxCol) return null

  const rowThreshold = maxRow * 0.1
  const colThreshold = maxCol * 0.1

  let top = 0
  while (top < smoothRows.length && smoothRows[top] < rowThreshold) top++

  let bottom = smoothRows.length - 1
  while (bottom > top && smoothRows[bottom] < rowThreshold) bottom--

  let left = 0
  while (left < smoothCols.length && smoothCols[left] < colThreshold) left++

  let right = smoothCols.length - 1
  while (right > left && smoothCols[right] < colThreshold) right--

  const cropWidth = right - left + 1
  const cropHeight = bottom - top + 1
  if (cropWidth < analysisWidth * 0.35 || cropHeight < analysisHeight * 0.35) return null

  const padX = Math.max(2, Math.round(cropWidth * 0.04))
  const padY = Math.max(2, Math.round(cropHeight * 0.04))
  const finalLeft = clamp(left - padX, 0, analysisWidth - 1)
  const finalTop = clamp(top - padY, 0, analysisHeight - 1)
  const finalRight = clamp(right + padX, finalLeft + 1, analysisWidth - 1)
  const finalBottom = clamp(bottom + padY, finalTop + 1, analysisHeight - 1)

  const sourceWidth = finalRight - finalLeft + 1
  const sourceHeight = finalBottom - finalTop + 1
  const areaRatio = (sourceWidth * sourceHeight) / (analysisWidth * analysisHeight)
  if (areaRatio > 0.98 || areaRatio < 0.25) return null

  return {
    x: Math.round(finalLeft / scale),
    y: Math.round(finalTop / scale),
    width: Math.max(1, Math.round(sourceWidth / scale)),
    height: Math.max(1, Math.round(sourceHeight / scale)),
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
  quality: number,
  cropRect?: CropRect | null
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

  if (cropRect) {
    context.drawImage(
      decoded.source,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      targetWidth,
      targetHeight
    )
  } else if (decoded.kind === "element" && decoded.orientation !== 1) {
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
    }
    context.drawImage(decoded.source, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight)
    context.restore()
  } else {
    context.drawImage(decoded.source, 0, 0, targetWidth, targetHeight)
  }

  if (targetWidth > 500) {
    context.filter = "contrast(1.1) brightness(1.02) saturate(1.05)"
    context.drawImage(canvas, 0, 0)
    context.filter = "none"

    try {
      const imageData = context.getImageData(0, 0, targetWidth, targetHeight)
      const data = imageData.data
      const weights = [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0]
      const side = Math.round(Math.sqrt(weights.length))
      const halfSide = Math.floor(side / 2)
      const output = context.createImageData(targetWidth, targetHeight)
      const dst = output.data

      for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
          const dstOff = (y * targetWidth + x) * 4
          let r = 0
          let g = 0
          let b = 0
          for (let cy = 0; cy < side; cy++) {
            for (let cx = 0; cx < side; cx++) {
              const scy = y + cy - halfSide
              const scx = x + cx - halfSide
              if (scy >= 0 && scy < targetHeight && scx >= 0 && scx < targetWidth) {
                const srcOff = (scy * targetWidth + scx) * 4
                const wt = weights[cy * side + cx]
                r += data[srcOff] * wt
                g += data[srcOff + 1] * wt
                b += data[srcOff + 2] * wt
              }
            }
          }
          dst[dstOff] = r
          dst[dstOff + 1] = g
          dst[dstOff + 2] = b
          dst[dstOff + 3] = data[dstOff + 3]
        }
      }
      context.putImageData(output, 0, 0)
    } catch (error) {
      console.warn("Fallo en filtro de nitidez:", error)
    }
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
    original: `${userId}/photos/${congressId}/${photoId}/original.jpg`,
    optimized: `${userId}/photos/${congressId}/${photoId}/optimized.jpg`,
    thumbnail: `${userId}/photos/${congressId}/${photoId}/thumb.webp`,
  }
}

export async function prepareCongressThumbnail(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<PreparedThumbnailResult> {
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

    const cropRect = detectSlideCropRect(decoded)
    const workingWidth = cropRect?.width ?? originalWidth
    const workingHeight = cropRect?.height ?? originalHeight
    const thumbnailTarget = computeTargetDimensions(
      workingWidth,
      workingHeight,
      merged.thumbnailMaxWidth,
      merged.thumbnailMaxHeight
    )

    const thumbnailFile = await renderVariant(
      decoded,
      thumbnailTarget.width,
      thumbnailTarget.height,
      "image/webp",
      merged.thumbnailQuality,
      cropRect
    )

    const thumbnailSize = thumbnailFile.size

    return {
      original: {
        width: originalWidth,
        height: originalHeight,
        sizeBytes: originalSize,
        mimeType: file.type,
      },
      thumbnail: {
        file: thumbnailFile,
        width: thumbnailTarget.width,
        height: thumbnailTarget.height,
        sizeBytes: thumbnailSize,
        mimeType: thumbnailFile.type,
      },
      compressionQuality: merged.thumbnailQuality,
      compressionRatio: calculateRatio(thumbnailSize, originalSize),
    }
  } finally {
    decoded.cleanup?.()
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

    const cropRect = detectSlideCropRect(decoded)
    const workingWidth = cropRect?.width ?? originalWidth
    const workingHeight = cropRect?.height ?? originalHeight
    const cropAreaRatio =
      cropRect ? (cropRect.width * cropRect.height) / (originalWidth * originalHeight) : 1
    const optimizedQuality = pickOptimizedQuality(
      cropAreaRatio,
      Math.max(workingWidth, workingHeight)
    )

    const optimizedTarget = computeTargetDimensions(
      workingWidth,
      workingHeight,
      merged.optimizedMaxWidth,
      merged.optimizedMaxHeight,
      merged.optimizedMinMajor
    )

    const thumbnailTarget = computeTargetDimensions(
      workingWidth,
      workingHeight,
      merged.thumbnailMaxWidth,
      merged.thumbnailMaxHeight
    )

    const optimizedFile = await renderVariant(
      decoded,
      optimizedTarget.width,
      optimizedTarget.height,
      "image/jpeg",
      optimizedQuality,
      cropRect
    )

    const thumbnailFile = await renderVariant(
      decoded,
      thumbnailTarget.width,
      thumbnailTarget.height,
      "image/webp",
      merged.thumbnailQuality,
      cropRect
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
      compressionQuality: optimizedQuality,
      compressionRatio: calculateRatio(optimizedSize, originalSize),
    }
  } finally {
    decoded.cleanup?.()
  }
}
