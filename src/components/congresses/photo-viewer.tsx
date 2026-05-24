"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Maximize2, Minimize2, Trash2, BrainCircuit, Loader2, FileText, Tags, BookOpen, Stethoscope, Edit3, Save, ExternalLink, Pencil, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { processImageWithAI } from "@/lib/actions/ai-processing"
import { getImageAnalysis } from "@/lib/actions/ai"
import { verifyCongressReferences, updateReferenceCandidate, verifySingleReference } from "@/lib/actions/references"
import { updateImageAnalysis } from "@/lib/actions/edits"
import { cleanSlideText } from "@/lib/clean-slide-text"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { clsx } from "clsx"
import { toast } from "sonner"

interface Photo {
  id: string
  original_filename: string
  signedUrl: string | null
  optimizedSignedUrl?: string | null
  status: string
  ai_status?: string | null
  ocr_status?: string | null
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
  slideText: string | null;
  imageType: string | null;
  summary: string | null;
  topics: { name: string; category: string }[];
  references: {
    id: string
    raw_text: string
    detected_title: string | null
    detected_authors: string | null
    detected_year: string | null
    detected_journal?: string | null
    verification_status?: string | null
    verification_notes?: string | null
    confidence_score?: number | null
    detected_doi?: string | null
    detected_pmid?: string | null
    is_open_access?: boolean
    open_access_url?: string | null
    citation_count?: number | null
    official_title?: string | null
    official_authors?: string | null
    official_year?: string | null
    official_journal?: string | null
  }[];
  specialty?: string | null;
  optimizedSignedUrl?: string | null;
  status?: string;
}

export default function PhotoViewer({ photos, congressId, initialIndex, onClose, onDelete }: PhotoViewerProps) {
  const router = useRouter()
  const t = useTranslations("viewer")
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isAnalyzingAction, setIsAnalyzingAction] = useState(false)
  const [isSavingAction, setIsSavingAction] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editOcr, setEditOcr] = useState("")
  const [showRawText, setShowRawText] = useState(false)
  const [selectedReferenceIndex, setSelectedReferenceIndex] = useState<number | null>(null)
  const [referenceDraft, setReferenceDraft] = useState({
    official_title: "",
    official_authors: "",
    official_year: "",
    official_journal: "",
    detected_doi: "",
    detected_pmid: "",
    verification_status: "not_verified",
    verification_notes: "",
  })
  const [isSavingReference, setIsSavingReference] = useState(false)

  const currentPhoto = photos[currentIndex]

  const isProcessed =
    currentPhoto.ai_status === "ai_done" ||
    currentPhoto.ocr_status === "ocr_done" ||
    currentPhoto.status === "analyzed" ||
    currentPhoto.status === "ocr_done"
  const isQueued = currentPhoto.ai_status === "ai_pending" || currentPhoto.ocr_status === "ocr_pending"
  const isProcessing = currentPhoto.status === "processing" || isAnalyzingAction || isSavingAction

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

  // Clamp the selected reference index during render when the analysis data
  // changes (React's recommended pattern over a setState-in-effect).
  const referenceCount = analysisData?.references?.length ?? 0
  if (selectedReferenceIndex !== null && (referenceCount === 0 || selectedReferenceIndex >= referenceCount)) {
    setSelectedReferenceIndex(null)
  }

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

  const handleAnalyze = async () => {
    if (!(currentPhoto?.optimizedSignedUrl ?? currentPhoto?.signedUrl)) return
    setIsAnalyzingAction(true)

    const analysisPromise = (async () => {
      const result = await processImageWithAI(currentPhoto.id)
      if (!result.success) throw new Error(result.error)
      const refreshed = await getImageAnalysis(currentPhoto.id)
      setAnalysisData(refreshed as unknown as AnalysisData)
      setShowMetadata(true)
      router.refresh()
      return result
    })()

    toast.promise(analysisPromise, {
      loading: t("analyzing"),
      success: t("analyzeDone"),
      error: (err) => err.message,
    })

    try {
      await analysisPromise
    } catch {
      // toast.promise already surfaces the error to the user.
    } finally {
      setIsAnalyzingAction(false)
    }
  }

  const handleSaveAnalysis = async () => {
    setIsSavingAction(true)
    void (async () => {
      // The editor shows the literal OCR (raw_text); persist there and mirror
      // cleaned_text so both stay in sync (fase32 separation).
      const result = await updateImageAnalysis(currentPhoto.id, congressId, {
        raw_text: editOcr,
        cleaned_text: editOcr,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message)
        setAnalysisData(prev => prev ? { ...prev, ocr: editOcr } : null)
        setIsEditing(false)
      }
    })().finally(() => {
      setIsSavingAction(false)
    })
  }

  const startEditing = () => {
    setEditOcr(analysisData?.ocr || "")
    setIsEditing(true)
  }

  const openReferenceDetail = (index: number) => {
    const ref = analysisData?.references?.[index]
    if (!ref) return
    setSelectedReferenceIndex(index)
    setReferenceDraft({
      official_title: ref.official_title || ref.detected_title || "",
      official_authors: ref.official_authors || ref.detected_authors || "",
      official_year: ref.official_year || ref.detected_year || "",
      official_journal: ref.official_journal || ref.detected_journal || "",
      detected_doi: ref.detected_doi || "",
      detected_pmid: ref.detected_pmid || "",
      verification_status: ref.verification_status || "not_verified",
      verification_notes: ref.verification_notes || "",
    })
  }

  const saveReferenceDetail = async () => {
    const ref = selectedReferenceIndex !== null ? analysisData?.references?.[selectedReferenceIndex] : null
    if (!ref) return
    setIsSavingReference(true)
    try {
      const result = await updateReferenceCandidate({
        id: ref.id,
        congressId,
        updates: {
          official_title: referenceDraft.official_title.trim() || null,
          official_authors: referenceDraft.official_authors.trim() || null,
          official_year: referenceDraft.official_year.trim() || null,
          official_journal: referenceDraft.official_journal.trim() || null,
          detected_doi: referenceDraft.detected_doi.trim() || null,
          detected_pmid: referenceDraft.detected_pmid.trim() || null,
          verification_status: referenceDraft.verification_status,
          verification_notes: referenceDraft.verification_notes.trim() || null,
        },
      })
      if (!result.success) throw new Error(result.error)
      toast.success(t("refSaved"))
      setAnalysisData((prev) =>
        prev
          ? {
              ...prev,
              references: prev.references.map((item, idx) =>
                idx === selectedReferenceIndex
                  ? {
                      ...item,
                      official_title: referenceDraft.official_title.trim() || null,
                      official_authors: referenceDraft.official_authors.trim() || null,
                      official_year: referenceDraft.official_year.trim() || null,
                      official_journal: referenceDraft.official_journal.trim() || null,
                      detected_doi: referenceDraft.detected_doi.trim() || null,
                      detected_pmid: referenceDraft.detected_pmid.trim() || null,
                      verification_status: referenceDraft.verification_status,
                      verification_notes: referenceDraft.verification_notes.trim() || null,
                    }
                  : item
              ),
            }
          : prev
      )
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("refSaveError"))
    } finally {
      setIsSavingReference(false)
    }
  }

  const reverifySelectedReference = async () => {
    const ref = selectedReferenceIndex !== null ? analysisData?.references?.[selectedReferenceIndex] : null
    if (!ref) return
    try {
      const result = await verifySingleReference({ referenceId: ref.id, congressId })
      if (!result.success) throw new Error(result.error)
      toast.success(t("refReverified"))
      setReferenceDraft((prev) => ({ ...prev, verification_status: result.data.status }))
      setAnalysisData((prev) =>
        prev
          ? {
              ...prev,
              references: prev.references.map((item, idx) =>
                idx === selectedReferenceIndex
                  ? { ...item, verification_status: result.data.status }
                  : item
              ),
            }
          : prev
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("reverifyError"))
    }
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
        loading: t("verifyingOpenalex"),
        success: t("refsValidated"),
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
                <span className="text-slate-400">{t("imageLoadError")}</span>
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
                onClick={handleAnalyze}
                disabled={isProcessing || isQueued}
                className={clsx(
                  "flex items-center justify-center gap-2 w-full",
                  isProcessed 
                    ? "border-blue-500/50 text-blue-400 hover:bg-blue-500/10" 
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isQueued ? (
                  <span className="h-4 w-4 rounded-full border border-blue-400/50" />
                ) : (
                  <BrainCircuit className="h-4 w-4" />
                )}
                {isProcessing ? t("btnProcessing") : isQueued ? t("btnQueued") : isProcessed ? t("btnReanalyze") : t("btnAnalyze")}
              </Button>
              
              {isQueued && (
                <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center">
                  {t("aiBackground")}
                </p>
              )}

              {isProcessed && !isProcessing && !isQueued && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="text-[10px] text-slate-400 hover:text-white uppercase tracking-wider"
                >
                  {showMetadata ? t("hideData") : t("showData")}
                </Button>
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
                <span className="hidden sm:inline">{t("delete")}</span>
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
              {t("medicalIntelligence")}
            </h3>
            <div className="flex items-center gap-2">
              {isProcessed && !isLoadingAnalysis && (
                isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-7 text-xs text-slate-400">
                      {t("cancel")}
                    </Button>
                    <Button onClick={handleSaveAnalysis} size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                      <Save className="h-3 w-3 mr-1" /> {t("save")}
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" onClick={startEditing} className="h-7 text-xs text-slate-400 hover:text-white">
                    <Edit3 className="h-3 w-3 mr-1" /> {t("edit")}
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
                <span className="text-sm">{t("extracting")}</span>
              </div>
            ) : analysisData ? (
              <>
                {/* Especialidad */}
                {analysisData.specialty && (
                  <section className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Stethoscope className="h-3 w-3" /> {t("specialtyDetected")}
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
                      <Tags className="h-3.5 w-3.5" /> {t("keyConcepts")}
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
                        <BookOpen className="h-3.5 w-3.5" /> {t("bibliography")}
                      </h4>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleVerifyReferences}
                        className="h-auto p-0 text-[10px] text-blue-400"
                      >
                        {t("verifyAll")}
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
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={clsx(
                              "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border",
                              ref.verification_status === "verified" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" :
                              ref.verification_status === "retracted" ? "border-red-500/40 bg-red-500/10 text-red-500" :
                              ref.verification_status === "partially_verified" ? "border-amber-500/40 bg-amber-500/10 text-amber-400" :
                              "border-slate-700 bg-slate-800 text-slate-500"
                            )}>
                              {ref.verification_status === "verified" ? t("refVerified") :
                               ref.verification_status === "retracted" ? t("refRetracted") :
                               ref.verification_status === "partially_verified" ? t("refPartial") : t("refPending")}
                            </span>
                            
                            {/* PDF Gratis */}
                            {ref.is_open_access && ref.open_access_url && (
                              <a 
                                href={ref.open_access_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                                title={t("pdfFree")}
                              >
                                {t("pdfFree")} <ExternalLink className="h-2 w-2" />
                              </a>
                            )}

                            {/* Enlaces directos */}
                            {ref.detected_doi && (
                              <a 
                                href={`https://doi.org/${ref.detected_doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                              >
                                DOI <ExternalLink className="h-2 w-2" />
                              </a>
                            )}
                            {ref.detected_pmid && (
                              <a 
                                href={`https://pubmed.ncbi.nlm.nih.gov/${ref.detected_pmid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                              >
                                PMID <ExternalLink className="h-2 w-2" />
                              </a>
                            )}
                            
                            {/* Fallback a búsqueda solo si no hay identificadores directos */}
                            {!ref.detected_doi && !ref.detected_pmid && (
                              <a 
                                href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(ref.official_title || ref.detected_title || ref.raw_text)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-slate-500/30 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 transition-colors flex items-center gap-1"
                              >
                                {t("searchPubmed")} <ExternalLink className="h-2 w-2" />
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Tipo de imagen clasificado por la IA */}
                {analysisData.imageType && (
                  <div>
                    <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                      {t(`type.${analysisData.imageType}`)}
                    </span>
                  </div>
                )}

                {/* Síntesis IA (interpretación) — protagonista: explica la diapositiva. */}
                {analysisData.summary && (
                  <section>
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> {t("aiSynthesis")}
                      <span className="text-[9px] font-bold normal-case px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 tracking-normal">
                        {t("interpretationBadge")}
                      </span>
                    </h4>
                    <div className="bg-blue-950/30 p-5 rounded-xl border border-blue-900/40">
                      <p className="text-[15px] text-slate-100 whitespace-pre-wrap font-sans leading-relaxed">
                        {analysisData.summary}
                      </p>
                    </div>
                  </section>
                )}

                {/* Texto literal de la diapositiva (OCR) — secundario y plegable. */}
                <section>
                  {/* En modo edición o sin síntesis disponible, se muestra siempre. */}
                  {(isEditing || showRawText || !analysisData.summary) ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" /> {t("slideText")}
                          <span className="text-[9px] font-bold normal-case px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 tracking-normal">
                            {t("extractedBadge")}
                          </span>
                        </h4>
                        {!isEditing && analysisData.summary && (
                          <button
                            onClick={() => setShowRawText(false)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                          >
                            {t("hide")} <ChevronUp className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      {isEditing ? (
                        <textarea
                          value={editOcr}
                          onChange={(e) => setEditOcr(e.target.value)}
                          className="w-full min-h-[300px] bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
                        />
                      ) : (
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                          <p className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                            {analysisData.slideText || cleanSlideText(analysisData.ocr) || analysisData.ocr}
                          </p>
                          <p className="mt-3 text-[10px] text-slate-500 italic">
                            {t("depuredNote")}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => setShowRawText(true)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950/50 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" /> {t("viewExtracted")}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  )}
                </section>

                {/* Empty State */}
                {!analysisData.ocr && !analysisData.summary && (!analysisData.topics || analysisData.topics.length === 0) && (!analysisData.references || analysisData.references.length === 0) && (
                  <div className="text-center text-slate-500 py-8 text-sm">
                    {t("emptyAnalysis")}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-red-400 py-8 text-sm">
                {t("analysisLoadError")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
