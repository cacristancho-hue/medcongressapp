"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, Trash2, BrainCircuit, Loader2, FileText, Tags, BookOpen, Stethoscope, Edit3, Save, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { processImageWithAI } from "@/lib/actions/ai-processing"
import { getImageAnalysis } from "@/lib/actions/ai"
import { verifyCongressReferences } from "@/lib/actions/references"
import { updateImageAnalysis } from "@/lib/actions/edits"
import Image from "next/image"
import { clsx } from "clsx"
import { toast } from "sonner"

interface Photo {
  id: string
  original_filename: string
  signedUrl: string | null
  optimizedSignedUrl?: string | null
  status: string
}

interface PhotoViewerProps {
  photos: Photo[]
  congressId: string
  initialIndex: number
  onClose: () => void
  onDelete: (photoId: string) => Promise<void>
}

interface AnalysisData {
  ocr: string | null;
  topics: { name: string; category: string }[];
  references: {
    raw_text: string
    detected_title: string | null
    detected_authors: string | null
    detected_year: string | null
    detected_journal?: string | null
    verification_status?: string | null
    verification_notes?: string | null
    confidence_score?: number | null
  }[];
  specialty?: string | null;
}

export default function PhotoViewer({ photos, congressId, initialIndex, onClose, onDelete }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isAnalyzing, startAnalysis] = useTransition()
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editOcr, setEditOcr] = useState("")

  const currentPhoto = photos[currentIndex]

  const isProcessed = currentPhoto.status === "analyzed" || currentPhoto.status === "ocr_done"
  const isProcessing = currentPhoto.status === "processing" || currentPhoto.status === "ai_pending" || isAnalyzing

  // Load analysis data when photo changes
  useEffect(() => {
    let mounted = true

    async function fetchAnalysis() {
      setIsLoadingAnalysis(true)
      try {
        const data = await getImageAnalysis(currentPhoto.id)
        if (mounted) {
          setAnalysisData(data as unknown as AnalysisData)
          setIsLoadingAnalysis(false)
          setShowMetadata(true)
        }
      } catch (error) {
        console.error("Error fetching analysis:", error)
        if (mounted) setIsLoadingAnalysis(false)
      }
    }

    if (isProcessed && !analysisData) {
      fetchAnalysis()
    }
    
    return () => { mounted = false }
  }, [currentPhoto?.id, isProcessed, analysisData])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
    setIsZoomed(false)
    setShowMetadata(false)
    setAnalysisData(null)
    setIsEditing(false)
  }, [photos.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
    setIsZoomed(false)
    setShowMetadata(false)
    setAnalysisData(null)
    setIsEditing(false)
  }, [photos.length])

  const handleAnalyze = () => {
    if (!(currentPhoto?.optimizedSignedUrl ?? currentPhoto?.signedUrl)) return
    toast.promise(
      async () => {
        const result = await processImageWithAI(currentPhoto.id)
        if (!result.success) throw new Error(result.error)
        return result
      },
      {
        loading: 'IA analizando imagen y bibliografía...',
        success: 'Análisis completado con éxito',
        error: (err) => err.message,
      }
    )
  }

  const handleSaveAnalysis = async () => {
    startAnalysis(async () => {
      const result = await updateImageAnalysis(currentPhoto.id, congressId, {
        cleaned_text: editOcr
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message)
        setAnalysisData(prev => prev ? { ...prev, ocr: editOcr } : null)
        setIsEditing(false)
      }
    })
  }

  const startEditing = () => {
    setEditOcr(analysisData?.ocr || "")
    setIsEditing(true)
  }

  const handleVerifyReferences = () => {
    toast.promise(
      async () => {
        const result = await verifyCongressReferences(congressId)
        if (!result.success) throw new Error(result.error)
        const refreshed = await getImageAnalysis(currentPhoto.id)
        setAnalysisData(refreshed as unknown as AnalysisData)
        return result
      },
      {
        loading: 'Verificando bibliografía en OpenAlex...',
        success: 'Referencias validadas',
        error: (err) => err.message,
      }
    )
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") handlePrev()
      if (e.key === "ArrowRight") handleNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, handlePrev, handleNext])

  if (!currentPhoto) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-slate-950 text-white select-none">
      
      {/* Left Area: Photo Viewer */}
      <div className={clsx(
        "flex-1 flex flex-col relative transition-all duration-300",
        showMetadata ? 'md:w-2/3' : 'w-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-md absolute top-0 left-0 right-0 z-20">
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-md">
              {currentPhoto.original_filename}
            </span>
            <span className="text-xs text-slate-400">
              {currentIndex + 1} de {photos.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsZoomed(!isZoomed)}
              className="hover:bg-slate-800"
            >
              {isZoomed ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main View */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black pt-16 pb-24">
          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* The Photo */}
          <div 
            className={clsx(
              "relative transition-all duration-300 ease-in-out flex items-center justify-center",
              isZoomed ? "w-full h-full" : "w-full max-w-full h-full p-4"
            )}
          >
            {(currentPhoto.optimizedSignedUrl ?? currentPhoto.signedUrl) ? (
              <Image
                src={currentPhoto.optimizedSignedUrl ?? currentPhoto.signedUrl ?? ""}
                alt={currentPhoto.original_filename}
                fill
                className={clsx(
                  "object-contain transition-transform duration-300",
                  isZoomed ? "scale-125" : "scale-100"
                )}
                sizes="100vw"
                priority
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <span className="text-6xl">🖼</span>
                <span className="text-slate-400">Error al cargar la imagen</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-4 z-20">
          <div className="flex justify-center gap-4 sm:gap-8 w-full max-w-md">
            <div className="flex flex-col items-center gap-2 flex-1">
              <Button
                variant={isProcessed ? "outline" : "default"}
                size="sm"
                onClick={isProcessed ? () => setShowMetadata(!showMetadata) : handleAnalyze}
                disabled={isProcessing}
                className={clsx(
                  "flex items-center justify-center gap-2 w-full",
                  isProcessed 
                    ? (showMetadata ? "bg-white text-slate-900" : "border-slate-500 text-slate-300 hover:text-white") 
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isProcessed ? (
                   <FileText className="h-4 w-4" />
                ) : (
                  <BrainCircuit className="h-4 w-4" />
                )}
                {isProcessed ? (showMetadata ? "Ocultar Datos" : "Ver Datos") : isProcessing ? "Procesando..." : "Analizar con IA"}
              </Button>
              {!isProcessed && !isProcessing && (
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Motor: GPT-4o Vision
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(currentPhoto.id)}
                className="flex items-center gap-2 px-3"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Area: Metadata Panel */}
      {showMetadata && (
        <div className="md:w-1/3 bg-slate-900 border-l border-slate-800 flex flex-col h-[50vh] md:h-full overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 flex items-center justify-between">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-blue-400" />
              Inteligencia Médica
            </h3>
            <div className="flex items-center gap-2">
              {isProcessed && !isLoadingAnalysis && (
                isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-7 text-xs text-slate-400">
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveAnalysis} size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                      <Save className="h-3 w-3 mr-1" /> Guardar
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" onClick={startEditing} className="h-7 text-xs text-slate-400 hover:text-white">
                    <Edit3 className="h-3 w-3 mr-1" /> Editar
                  </Button>
                )
              )}
              <Button variant="ghost" size="icon" onClick={() => setShowMetadata(false)} className="md:hidden h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {isLoadingAnalysis ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-sm">Extrayendo conocimiento médico...</span>
              </div>
            ) : analysisData ? (
              <>
                {/* Especialidad */}
                {analysisData.specialty && (
                  <section className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Stethoscope className="h-3 w-3" /> Especialidad Detectada
                    </h4>
                    <p className="text-sm font-semibold text-slate-100">
                      {analysisData.specialty}
                    </p>
                  </section>
                )}

                {/* Tópicos */}
                {analysisData.topics?.length > 0 && (
                  <section>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Tags className="h-3.5 w-3.5" /> Conceptos Clave
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.topics.map((topic, i) => (
                        <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {topic.name}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Referencias */}
                {analysisData.references?.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5" /> Bibliografía
                      </h4>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleVerifyReferences}
                        className="h-auto p-0 text-[10px] text-blue-400"
                      >
                        Verificar todas
                      </Button>
                    </div>
                    <ul className="space-y-3">
                      {analysisData.references.map((ref, i) => (
                        <li key={i} className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
                          <p className="text-xs text-slate-200 font-medium leading-relaxed mb-1">
                            {ref.detected_title || ref.raw_text}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {ref.detected_authors} {ref.detected_year ? `· ${ref.detected_year}` : ""}
                          </p>
                          {ref.detected_journal && (
                            <p className="text-[10px] text-blue-400/70 mt-1 font-mono">{ref.detected_journal}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={clsx(
                              "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border",
                              ref.verification_status === "verified" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" :
                              ref.verification_status === "partially_verified" ? "border-amber-500/40 bg-amber-500/10 text-amber-400" :
                              "border-slate-700 bg-slate-800 text-slate-500"
                            )}>
                              {ref.verification_status === "verified" ? "Verificado" : 
                               ref.verification_status === "partially_verified" ? "Parcial" : "Pendiente"}
                            </span>
                            
                            {/* Enlaces externos de búsqueda médica */}
                            <a 
                              href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(ref.detected_title || ref.raw_text)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                            >
                              PubMed <ExternalLink className="h-2 w-2" />
                            </a>
                            <a 
                              href={`https://scholar.google.com/scholar?q=${encodeURIComponent(`${ref.detected_title} ${ref.detected_authors}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                            >
                              Scholar <ExternalLink className="h-2 w-2" />
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* OCR Text / Resumen */}
                <section>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" /> Resumen y Hallazgos
                  </h4>
                  {isEditing ? (
                    <textarea
                      value={editOcr}
                      onChange={(e) => setEditOcr(e.target.value)}
                      className="w-full min-h-[300px] bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    />
                  ) : (
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {analysisData.ocr}
                      </p>
                    </div>
                  )}
                </section>
                
                {/* Empty State */}
                {!analysisData.ocr && (!analysisData.topics || analysisData.topics.length === 0) && (!analysisData.references || analysisData.references.length === 0) && (
                  <div className="text-center text-slate-500 py-8 text-sm">
                    La IA no encontró información médica relevante en esta imagen.
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-red-400 py-8 text-sm">
                Error al cargar los datos del análisis.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
