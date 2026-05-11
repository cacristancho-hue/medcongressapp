"use client"
import { useState, useEffect, useMemo } from "react"
import { deleteImage, deleteImages } from "@/lib/actions/photos"
import { toast } from "sonner"
import PhotoCard from "./photo-card"
import PhotoViewer from "./photo-viewer"
import CongressSearch from "./congress-search"
import { clsx } from "clsx"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Trash2, CheckSquare, Square, X, ListChecks } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface Photo {
  id: string
  storage_path: string
  storage_path_optimized?: string | null
  storage_path_thumbnail?: string | null
  original_filename: string
  file_size: number | null
  status: string
  created_at: string
  signedUrl: string | null
  thumbSignedUrl?: string | null
  optimizedSignedUrl?: string | null
  ocr_text?: string | null
}

interface Props {
  congressId: string
  initialImages: Photo[]
}

export default function PhotoGrid({ congressId, initialImages }: Props) {
  const searchParams = useSearchParams()
  const highlightId = searchParams.get("highlight")
  
  const [images, setImages] = useState<Photo[]>(initialImages)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Gestión de Selección por Lotes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // Sincronización local
  const [prevInitialImages, setPrevInitialImages] = useState(initialImages)
  if (initialImages !== prevInitialImages) {
    setImages(initialImages)
    setPrevInitialImages(initialImages)
  }

  // Scroll al elemento destacado
  useEffect(() => {
    if (highlightId) {
      // Pequeño timeout para asegurar que el DOM esté listo
      const timer = setTimeout(() => {
        const el = document.getElementById(`photo-${highlightId}`)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [highlightId, images])

  // Sincronización Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`congress_images_${congressId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "congress_images", filter: `congress_id=eq.${congressId}` }, 
      (payload) => {
        if (payload.eventType === "UPDATE") {
          setImages(prev => prev.map(img => img.id === payload.new.id ? { ...img, ...payload.new } : img))
        } else if (payload.eventType === "DELETE") {
          setImages(prev => prev.filter(img => img.id !== payload.old.id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [congressId])

  const filteredImages = useMemo(() => {
    if (!searchTerm) return images
    const s = searchTerm.toLowerCase()
    return images.filter(img => 
      img.original_filename.toLowerCase().includes(s) || 
      img.ocr_text?.toLowerCase().includes(s)
    )
  }, [images, searchTerm])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    const visibleIds = filteredImages.map((img) => img.id)
    const allSelected = visibleIds.every((id) => selectedIds.has(id))
    if (allSelected) {
      const next = new Set(selectedIds)
      visibleIds.forEach((id) => next.delete(id))
      setSelectedIds(next)
    } else {
      const next = new Set(selectedIds)
      visibleIds.forEach((id) => next.add(id))
      setSelectedIds(next)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`¿Eliminar ${selectedIds.size} foto${selectedIds.size === 1 ? "" : "s"}? Esta acción no se puede deshacer.`)) return

    const ids = Array.from(selectedIds)
    const result = await deleteImages(ids, congressId)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(`${result.deleted ?? ids.length} foto${(result.deleted ?? ids.length) === 1 ? "" : "s"} eliminada${(result.deleted ?? ids.length) === 1 ? "" : "s"}`)
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }

  async function handleDelete(photoId: string) {
    const photo = images.find(p => p.id === photoId)
    if (!photo) return
    if (confirm("¿Estás seguro de eliminar esta foto?")) {
      await deleteImage(photo.id, photo.storage_path, congressId)
      setViewerIndex(null)
    }
  }

  if (!images?.length) {
    return <p className="text-sm text-slate-400 text-center py-6">Aún no hay fotos.</p>
  }

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <CongressSearch onSearch={setSearchTerm} />
        
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <>
              <span className="text-xs font-bold text-blue-600 mr-2">
                {selectedIds.size} seleccionada{selectedIds.size === 1 ? "" : "s"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="h-8 text-xs"
                title="Seleccionar / deseleccionar todas las visibles"
              >
                <ListChecks className="h-3 w-3 mr-1" />
                {filteredImages.every((img) => selectedIds.has(img.id)) && filteredImages.length > 0
                  ? "Deseleccionar todas"
                  : "Seleccionar todas"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" /> Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
                className="h-8 text-xs font-bold"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Eliminar lote
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsSelectionMode(true)}
              className="h-8 text-xs text-slate-600 border-slate-300"
            >
              <CheckSquare className="h-3 w-3 mr-1" /> Selección Múltiple
            </Button>
          )}
        </div>
      </div>

      {filteredImages.length === 0 && images.length > 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-500 italic">No se encontraron fotos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {filteredImages.map((photo) => {
            const idx = images.findIndex(img => img.id === photo.id)
            const isProcessing = photo.status === "processing" || photo.status === "ai_pending"
            const isSelected = selectedIds.has(photo.id)
            const isHighlighted = highlightId === photo.id

            return (
              <div 
                key={photo.id} 
                id={`photo-index-${idx}`}
                onClick={() => isSelectionMode ? toggleSelect(photo.id) : (!isProcessing && setViewerIndex(idx))} 
                className={clsx(
                  "relative cursor-pointer transition-all duration-200 rounded-lg overflow-hidden",
                  isProcessing && "cursor-wait",
                  isSelected ? "ring-4 ring-blue-500 ring-offset-2 scale-95" : 
                  isHighlighted ? "ring-4 ring-amber-400 ring-offset-2 scale-105 z-10 shadow-xl" : "hover:scale-[1.02]"
                )}
              >
                <PhotoCard
                  photo={photo}
                  deleteAction={deleteImage.bind(null, photo.id, photo.storage_path, congressId)}
                />
                
                {isSelectionMode && (
                  <div className="absolute top-2 right-2 z-10">
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-blue-500 fill-white" />
                    ) : (
                      <Square className="h-5 w-5 text-white/50" />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {viewerIndex !== null && (
        <PhotoViewer
          photos={images}
          congressId={congressId}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
