"use client"

import { useState, useTransition } from "react"
import { Trash2, Loader2, Clock3 } from "lucide-react"
import Image from "next/image"
import { clsx } from "clsx"

interface Photo {
  id: string
  original_filename: string
  file_size: number | null
  thumbSignedUrl?: string | null
  signedUrl?: string | null
  status: string
  ai_status?: string | null
  ocr_status?: string | null
}

interface Props {
  photo: Photo
  deleteAction: () => Promise<{ error?: string }>
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PhotoCard({ photo, deleteAction }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isQueued = photo.ai_status === "ai_pending" || photo.ocr_status === "ocr_pending"
  const isProcessing = photo.status === "processing"

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirming(true)
    setDeleteError(null)
  }

  function handleConfirm(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      const result = await deleteAction()
      if (result.error) {
        setDeleteError(result.error)
        setConfirming(false)
      }
    })
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirming(false)
    setDeleteError(null)
  }

  return (
    <div className={clsx(
      "relative group rounded-lg overflow-hidden bg-slate-100 aspect-square",
      isProcessing && "cursor-wait"
    )}>
      {/* Image */}
      {(photo.thumbSignedUrl ?? photo.signedUrl) ? (
        <Image
          src={photo.thumbSignedUrl ?? photo.signedUrl ?? ""}
          alt={photo.original_filename}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
          className={clsx("object-cover", isProcessing && "opacity-40 grayscale")}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 text-center">
          <span className="text-2xl">🖼</span>
          <span className="text-xs text-slate-400 truncate w-full text-center">
            {photo.original_filename}
          </span>
        </div>
      )}

      {/* Processing Badge */}
      {isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/10">
          <Loader2 className="h-6 w-6 text-slate-700 animate-spin" />
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded shadow-sm">
            Procesando
          </span>
        </div>
      )}

      {!isProcessing && isQueued && (
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm">
          <Clock3 className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">
            En cola
          </span>
        </div>
      )}

      {/* Hover overlay */}
      {!isProcessing && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors pointer-events-none" />
      )}

      {/* Bottom filename bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-4 translate-y-full group-hover:translate-y-0 transition-transform">
        <p className="text-white text-xs truncate leading-tight">{photo.original_filename}</p>
        {photo.file_size && (
          <p className="text-white/60 text-xs">{formatBytes(photo.file_size)}</p>
        )}
      </div>

      {/* Delete controls — show on hover */}
      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {!confirming ? (
          <button
            onClick={handleDeleteClick}
            disabled={isPending}
            className="bg-black/60 hover:bg-red-600 text-white rounded p-1 transition-colors"
            title="Eliminar foto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 bg-black/70 rounded px-1.5 py-1">
            <span className="text-white text-xs">¿Eliminar?</span>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs px-1.5 py-0.5 rounded transition-colors"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sí"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-1.5 py-0.5 rounded transition-colors"
            >
              No
            </button>
          </div>
        )}
      </div>

      {deleteError && (
        <div className="absolute inset-x-0 bottom-0 bg-red-600 text-white text-xs text-center py-1">
          {deleteError}
        </div>
      )}
    </div>
  )
}
