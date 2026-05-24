"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { Upload, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { clsx } from "clsx"
import { registerImage } from "@/lib/actions/photos"
import { enqueueImageAnalysis, enqueueImageDerivation } from "@/lib/actions/queue"
import { processImageWithAI } from "@/lib/actions/ai-processing"
import { kickQueuedAiJobs } from "@/lib/worker-kick"
import { buildCongressPhotoPaths, readExifCapturedAt } from "@/lib/image-processing"
import UploadDisclaimer from "@/components/legal/upload-disclaimer"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const MAX_PHOTOS = 100
const MAX_FILE_SIZE = 20 * 1024 * 1024
type FileStatus = "queued" | "hashing" | "duplicate_check" | "uploading" | "processing" | "done" | "error" | "potential_duplicate"

interface UploadItem {
  id: string
  file: File
  status: FileStatus
  error?: string
  hash?: string
  existingImageId?: string
}

function isHeicFile(file: File) {
  const name = file.name.toLowerCase()
  return file.type === "image/heic" || file.type === "image/heif" || name.endsWith(".heic") || name.endsWith(".heif")
}

interface Props {
  congressId: string
  userId: string
  currentCount: number
  aiEnabled?: boolean
  fastPathLimit?: number
}

async function calculateHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
) {
  const queue = [...items]
  const active: Promise<void>[] = []

  const pump = async () => {
    const next = queue.shift()
    if (!next) return
    const task = worker(next).finally(() => {
      const index = active.indexOf(task)
      if (index >= 0) active.splice(index, 1)
    })
    active.push(task)
    if (active.length >= limit) {
      await Promise.race(active)
    }
    await pump()
  }

  await pump()
  await Promise.all(active)
}

export default function PhotoUploadZone({ congressId, userId, currentCount, aiEnabled = false, fastPathLimit = 15 }: Props) {
  const router = useRouter()
  const t = useTranslations("upload")
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<UploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false)

  const remaining = MAX_PHOTOS - currentCount

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }, [])

  const uploadOne = useCallback(
    async (item: UploadItem, skipDuplicateCheck = false, processImmediately = false) => {
      updateItem(item.id, { status: "uploading" })
      const supabase = createClient()
      const paths = buildCongressPhotoPaths(userId, congressId, item.id)

      const cleanupUploadedBlob = async () => {
        await supabase.storage.from("congress-photos").remove([paths.original])
      }

      if (!skipDuplicateCheck && item.hash) {
        updateItem(item.id, { status: "duplicate_check" })
        const { data: existing } = await supabase
          .from("congress_images")
          .select("id, original_filename")
          .eq("congress_id", congressId)
          .eq("file_hash", item.hash)
          .maybeSingle()

        if (existing) {
          updateItem(item.id, {
            status: "potential_duplicate",
            existingImageId: existing.id,
            error: t("duplicateExists", { name: existing.original_filename })
          })
          return
        }
      }

      const { error: originalErr } = await supabase.storage
        .from("congress-photos")
        .upload(paths.original, item.file, {
          contentType: item.file.type,
          upsert: true,
        })

      if (originalErr) {
        updateItem(item.id, { status: "error", error: originalErr.message })
        return
      }

      // Capture time (EXIF) read from the original file; null when unavailable.
      const capturedAt = await readExifCapturedAt(item.file)

      const { error: regErr } = await registerImage({
        id: item.id,
        congress_id: congressId,
        user_id: userId,
        storage_path: paths.original,
        storage_path_optimized: null,
        storage_path_thumbnail: null,
        width_original: null,
        height_original: null,
        width_optimized: null,
        height_optimized: null,
        width_thumbnail: null,
        height_thumbnail: null,
        size_original_bytes: item.file.size,
        size_optimized_bytes: null,
        size_thumbnail_bytes: null,
        compression_quality: null,
        compression_ratio: null,
        mime_type_original: item.file.type,
        mime_type_optimized: null,
        mime_type_thumbnail: null,
        upload_status: "uploaded",
        external_sync_status: "not_configured",
        ocr_status: "pending",
        ai_status: "pending",
        original_filename: item.file.name,
        file_size: item.file.size,
        mime_type: item.file.type,
        file_hash: item.hash,
        captured_at: capturedAt,
      })

      if (regErr) {
        await cleanupUploadedBlob().catch((cleanupErr) => {
          console.error("No se pudo limpiar el blob tras fallar el registro:", cleanupErr)
        })
        updateItem(item.id, { status: "error", error: regErr })
        return
      }

      void enqueueImageDerivation({
        imageId: item.id,
        congressId,
      }).catch((error) => {
        console.error("No se pudo encolar la derivacion de imagen:", error)
      })

      if (aiEnabled) {
        if (processImmediately) {
          try {
            updateItem(item.id, { status: "processing" })
            await processImageWithAI(item.id)
            updateItem(item.id, { status: "done" })
            return
          } catch (error) {
            console.error("No se pudo procesar la imagen al vuelo, se dejara lista para cola:", error)
            void enqueueImageAnalysis({
              imageId: item.id,
              congressId,
            }).catch((queueError) => {
              console.error("No se pudo encolar el analisis automatico:", queueError)
            })
            updateItem(item.id, { status: "queued" })
            return
          }
        } else {
          void enqueueImageAnalysis({
            imageId: item.id,
            congressId,
          }).catch((error) => {
            console.error("No se pudo encolar el analisis automatico:", error)
          })
          updateItem(item.id, { status: "queued" })
          return
        }
      }

      updateItem(item.id, { status: "done" })
    },
    [userId, congressId, updateItem, aiEnabled, t]
  )

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (isUploading) return
      const valid: UploadItem[] = []

      for (const file of Array.from(fileList)) {
        if (valid.length >= remaining) break
        if (isHeicFile(file) || !file.type.startsWith("image/") || file.size > MAX_FILE_SIZE) continue

        valid.push({ id: generateId(), file, status: "queued" })
      }

      if (!valid.length) return
      setItems(valid)
      setIsUploading(true)

      const processImmediately = aiEnabled && valid.length <= fastPathLimit

      if (aiEnabled && valid.length > fastPathLimit) {
        toast.info(t("largeUpload", { count: valid.length }))
      }

      try {
        const UPLOAD_CONCURRENCY = 3
        await runWithConcurrency(valid, UPLOAD_CONCURRENCY, async (item) => {
          updateItem(item.id, { status: "hashing" })
          const hash = await calculateHash(item.file)
          item.hash = hash
          await uploadOne(item, false, processImmediately)
        })

        if (aiEnabled) {
          void kickQueuedAiJobs().catch((error) => {
            console.error("No se pudo activar el worker de IA:", error)
          })
        }
      } finally {
        setIsUploading(false)
        router.refresh()
      }
    },
    [aiEnabled, fastPathLimit, currentCount, isUploading, remaining, uploadOne, updateItem, router, t]
  )

  if (remaining === 0) return <div className="p-4 text-center text-slate-500 border rounded-lg">{t("limitReached")}</div>
  if (!hasAcceptedDisclaimer) return <UploadDisclaimer onAccept={() => setHasAcceptedDisclaimer(true)} />

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={clsx(
          "rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
          isUploading ? "bg-slate-50 border-slate-200 cursor-wait" : "bg-white border-slate-300 hover:border-teal-500 hover:bg-teal-50/30"
        )}
      >
        <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-700">{t("title")}</p>
        <p className="text-xs text-slate-400 mt-1">{t("slotsAvailable", { count: remaining })}</p>
      </div>

      <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />

      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {items.map((item) => (
          <div key={item.id} className={clsx(
            "flex flex-col gap-2 p-3 rounded-lg border transition-all",
            item.status === "potential_duplicate" ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100"
          )}>
            <div className="flex items-center gap-3">
              {item.status === "uploading" || item.status === "processing" || item.status === "hashing" ? (
                <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
              ) : item.status === "done" ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : item.status === "potential_duplicate" ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : item.status === "error" ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{item.file.name}</p>
                {item.error && <p className="text-[10px] text-red-500 mt-0.5">{item.error}</p>}
              </div>

              {item.status === "potential_duplicate" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] bg-white text-amber-700 border-amber-200 hover:bg-amber-100"
                    onClick={() => uploadOne(item, true)}
                  >
                    {t("uploadAnyway")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] text-slate-500"
                    onClick={() => updateItem(item.id, { status: "error", error: t("skippedByUser") })}
                  >
                    {t("skip")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
