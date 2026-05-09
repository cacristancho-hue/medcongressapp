"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { clsx } from "clsx"
import { registerImage } from "@/lib/actions/photos"
import { processImageWithAI } from "@/lib/actions/ai-processing"
import { buildCongressPhotoPaths, prepareCongressPhotoVariants } from "@/lib/image-processing"

const MAX_PHOTOS = 100
const MAX_FILE_SIZE = 20 * 1024 * 1024
const CONCURRENCY = 3

type FileStatus = "queued" | "uploading" | "processing" | "done" | "error"

interface UploadItem {
  id: string
  file: File
  status: FileStatus
  error?: string
}

interface Props {
  congressId: string
  userId: string
  currentCount: number
}

export default function PhotoUploadZone({ congressId, userId, currentCount }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [items, setItems] = useState<UploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const remaining = MAX_PHOTOS - currentCount

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }, [])

  const uploadOne = useCallback(
    async (item: UploadItem) => {
      updateItem(item.id, { status: "uploading" })
      const supabase = createClient()
      const paths = buildCongressPhotoPaths(userId, congressId, item.id)

      let prepared
      try {
        prepared = await prepareCongressPhotoVariants(item.file)
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo procesar la imagen"
        updateItem(item.id, { status: "error", error: message })
        return
      }

      const { error: optimizedErr } = await supabase.storage
        .from("congress-photos")
        .upload(paths.optimized, prepared.optimized.file, {
          contentType: prepared.optimized.mimeType,
          upsert: false,
        })

      if (optimizedErr) {
        updateItem(item.id, { status: "error", error: optimizedErr.message })
        return
      }

      const { error: thumbErr } = await supabase.storage
        .from("congress-photos")
        .upload(paths.thumbnail, prepared.thumbnail.file, {
          contentType: prepared.thumbnail.mimeType,
          upsert: false,
        })

      if (thumbErr) {
        await supabase.storage.from("congress-photos").remove([paths.optimized])
        updateItem(item.id, { status: "error", error: thumbErr.message })
        return
      }

      const { error: regErr } = await registerImage({
        congress_id: congressId,
        user_id: userId,
        storage_path: paths.optimized,
        storage_path_optimized: paths.optimized,
        storage_path_thumbnail: paths.thumbnail,
        width_original: prepared.original.width,
        height_original: prepared.original.height,
        width_optimized: prepared.optimized.width,
        height_optimized: prepared.optimized.height,
        width_thumbnail: prepared.thumbnail.width,
        height_thumbnail: prepared.thumbnail.height,
        size_original_bytes: prepared.original.sizeBytes,
        size_optimized_bytes: prepared.optimized.sizeBytes,
        size_thumbnail_bytes: prepared.thumbnail.sizeBytes,
        compression_quality: prepared.compressionQuality,
        compression_ratio: prepared.compressionRatio,
        mime_type_original: prepared.original.mimeType,
        mime_type_optimized: prepared.optimized.mimeType,
        mime_type_thumbnail: prepared.thumbnail.mimeType,
        upload_status: "uploaded",
        external_sync_status: "not_configured",
        ocr_status: "pending",
        ai_status: "pending",
        original_filename: item.file.name,
        file_size: prepared.optimized.sizeBytes,
        mime_type: prepared.optimized.mimeType,
      })

      if (regErr) {
        await supabase.storage.from("congress-photos").remove([paths.optimized, paths.thumbnail])
        updateItem(item.id, { status: "error", error: regErr })
        return
      }

      // Iniciar procesamiento de IA de forma asíncrona
      updateItem(item.id, { status: "processing" })
      processImageWithAI(item.id).catch(console.error)

      updateItem(item.id, { status: "done" })
    },
    [userId, congressId, updateItem]
  )

  const runQueue = useCallback(
    async (batch: UploadItem[]) => {
      setIsUploading(true)
      for (let i = 0; i < batch.length; i += CONCURRENCY) {
        await Promise.all(batch.slice(i, i + CONCURRENCY).map(uploadOne))
      }
      setIsUploading(false)
      router.refresh()
    },
    [uploadOne, router]
  )

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      if (isUploading) return
      const valid: UploadItem[] = []
      for (const file of Array.from(fileList)) {
        if (valid.length >= remaining) break
        if (!file.type.startsWith("image/")) continue
        if (file.size > MAX_FILE_SIZE) continue
        valid.push({ id: crypto.randomUUID(), file, status: "queued" })
      }
      if (!valid.length) return
      setItems(valid)
      runQueue(valid)
    },
    [isUploading, remaining, runQueue]
  )

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current++
    setIsDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const doneCount = items.filter((i) => i.status === "done").length
  const errorCount = items.filter((i) => i.status === "error").length
  const totalCount = items.length

  if (remaining === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 text-center">
        Límite alcanzado: 100 / 100 fotos. Elimina algunas para subir más.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={clsx(
          "rounded-lg border-2 border-dashed transition-colors select-none",
          isUploading
            ? "cursor-default border-slate-200 bg-slate-50"
            : "cursor-pointer hover:border-slate-400 hover:bg-slate-50",
          isDragging
            ? "border-slate-700 bg-slate-50"
            : "border-slate-300 bg-white"
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center pointer-events-none">
          {isUploading ? (
            <>
              <Loader2 className="h-7 w-7 text-slate-400 animate-spin" />
              <p className="text-sm font-medium text-slate-700">
                Subiendo {doneCount + errorCount} de {totalCount}...
              </p>
            </>
          ) : (
            <>
              <Upload className="h-7 w-7 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Arrastra fotos aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  JPG, PNG, WEBP · máx. 20 MB por foto · {remaining} disponible{remaining !== 1 ? "s" : ""}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {items.length > 0 && (
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 bg-slate-50 border border-slate-100"
            >
              <span className="shrink-0">
                {item.status === "done" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {item.status === "error" && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                {item.status === "uploading" && (
                  <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                )}
                {item.status === "queued" && (
                  <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                )}
              </span>
              <span className="text-xs text-slate-700 truncate flex-1 min-w-0">
                {item.file.name}
              </span>
              {item.error && (
                <span className="text-xs text-red-500 shrink-0">{item.error}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {!isUploading && items.length > 0 && (
        <p className="text-xs text-slate-500">
          {doneCount > 0 && `${doneCount} foto${doneCount !== 1 ? "s" : ""} subida${doneCount !== 1 ? "s" : ""}`}
          {errorCount > 0 && ` · ${errorCount} con error`}
        </p>
      )}
    </div>
  )
}
