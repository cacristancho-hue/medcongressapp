"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Upload, CheckCircle, XCircle, Loader2, AlertTriangle, Check, RefreshCw } from "lucide-react"
import { clsx } from "clsx"
import { toast } from "sonner"
import { registerImage } from "@/lib/actions/photos"
import { enqueueImageAnalysis } from "@/lib/actions/queue"
import { processImageWithAI } from "@/lib/actions/ai-processing"
import { buildCongressPhotoPaths, prepareCongressPhotoVariants } from "@/lib/image-processing"
import UploadDisclaimer from "@/components/legal/upload-disclaimer"
import { Button } from "@/components/ui/button"

const MAX_PHOTOS = 100
const MAX_FILE_SIZE = 20 * 1024 * 1024
const CONCURRENCY = 8

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

export default function PhotoUploadZone({ congressId, userId, currentCount, aiEnabled = false }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [items, setItems] = useState<UploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false)

  const remaining = MAX_PHOTOS - currentCount

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }, [])

  const uploadOne = useCallback(
    async (item: UploadItem, skipDuplicateCheck = false) => {
      updateItem(item.id, { status: "uploading" })
      const supabase = createClient()

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
            error: `Ya existe como "${existing.original_filename}"`
          })
          return
        }
      }

      const paths = buildCongressPhotoPaths(userId, congressId, item.id)

      let prepared
      try {
        prepared = await prepareCongressPhotoVariants(item.file)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error procesando imagen"
        updateItem(item.id, { status: "error", error: message })
        return
      }

      const { error: optimizedErr } = await supabase.storage
        .from("congress-photos")
        .upload(paths.optimized, prepared.optimized.file, {
          contentType: prepared.optimized.mimeType,
          upsert: true,
        })

      if (optimizedErr) {
        updateItem(item.id, { status: "error", error: optimizedErr.message })
        return
      }

      const { error: thumbErr } = await supabase.storage
        .from("congress-photos")
        .upload(paths.thumbnail, prepared.thumbnail.file, {
          contentType: prepared.thumbnail.mimeType,
          upsert: true,
        })

      const { error: regErr } = await registerImage({
        id: item.id,
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
        file_hash: item.hash,
      } as any)

      if (regErr) {
        updateItem(item.id, { status: "error", error: regErr })
        return
      }

      if (aiEnabled) {
        updateItem(item.id, { status: "processing" })
        const enqueued = await enqueueImageAnalysis({
          imageId: item.id,
          congressId,
        })
        if (!enqueued.success) {
          processImageWithAI(item.id).catch(console.error)
        }
      }

      updateItem(item.id, { status: "done" })
    },
    [userId, congressId, updateItem, aiEnabled]
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
      
      // Proceso secuencial/paralelo con hashing
      for (const item of valid) {
        updateItem(item.id, { status: "hashing" })
        const hash = await calculateHash(item.file)
        item.hash = hash
        await uploadOne(item)
      }
      
      setIsUploading(false)
      router.refresh()
    },
    [isUploading, remaining, uploadOne, updateItem, router]
  )

  if (remaining === 0) return <div className="p-4 text-center text-slate-500 border rounded-lg">Límite alcanzado</div>
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
        <p className="text-sm font-medium text-slate-700">Subir fotos del congreso</p>
        <p className="text-xs text-slate-400 mt-1">{remaining} espacios disponibles</p>
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
                    Subir de todos modos
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 text-[10px] text-slate-500"
                    onClick={() => updateItem(item.id, { status: "error", error: "Omitida por el usuario" })}
                  >
                    Omitir
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
