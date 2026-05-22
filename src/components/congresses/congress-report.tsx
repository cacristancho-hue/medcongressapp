"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { generateAcademicReport } from "@/lib/actions/polyglot-reports"
import { enqueueReportGeneration } from "@/lib/actions/queue"
import { updateReportContent, updateReportTitle, deleteReport } from "@/lib/actions/edits"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Calendar, ChevronDown, ChevronUp, Loader2, Save, Edit3, Trash2, X, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface Report {
  id: string
  title: string
  content: string
  created_at: string
  report_type: string
}

interface ReportSession {
  id: string
  title: string
}

interface CongressReportProps {
  congressId: string
  reports: Report[]
  sessions?: ReportSession[]
}

export default function CongressReport({ congressId, reports, sessions = [] }: CongressReportProps) {
  const router = useRouter()
  const [isGenerating, startGenerating] = useTransition()
  // "" = todo el congreso; o el id de una sesión.
  const [reportScope, setReportScope] = useState<string>("")
  // Idioma del reporte generado (el motor IA ya soporta ES/EN).
  const [reportLang, setReportLang] = useState<"es" | "en">("es")
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState<string | null>(null)
  const [tempContent, setTempContent] = useState("")
  const [tempTitle, setTempTitle] = useState("")
  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`reports:${congressId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports", filter: `congress_id=eq.${congressId}` },
        () => {
          if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
          refreshTimerRef.current = setTimeout(() => {
            router.refresh()
          }, 250)
        }
      )
      .subscribe()

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      supabase.removeChannel(channel)
    }
  }, [congressId, router])

  const handleGenerate = () => {
    startGenerating(async () => {
      try {
        const result = await enqueueReportGeneration({
          congressId,
          language: reportLang,
          sessionId: reportScope || null,
        })
        if (!result.success) {
          toast.error(result.error)
          return
        }
        if ("message" in result && result.message) {
          toast.info(result.message)
        } else {
          toast.success("Solicitud enviada. El resumen aparecerá cuando la cola termine de procesarlo.")
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al encolar el esquema")
      }
    })
  }

  const handleStartEdit = (report: Report) => {
    setTempContent(report.content)
    setIsEditing(report.id)
  }

  const handleSaveEdit = (reportId: string) => {
    startSaving(async () => {
      const res = await updateReportContent(reportId, congressId, tempContent)
      if (res.success) {
        toast.success(res.message)
        setIsEditing(null)
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleStartRename = (report: Report) => {
    setTempTitle(report.title)
    setIsRenaming(report.id)
  }

  const handleSaveRename = (reportId: string) => {
    if (!tempTitle.trim()) return
    startSaving(async () => {
      const res = await updateReportTitle(reportId, congressId, tempTitle)
      if (res.success) {
        toast.success(res.message)
        setIsRenaming(null)
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleDeleteReport = (reportId: string) => {
    startDeleting(async () => {
      const res = await deleteReport(reportId, congressId)
      if (res.success) {
        toast.success(res.message)
        setConfirmDelete(null)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-600" />
          Resúmenes y Esquemas Académicos
        </h3>
        <div className="flex items-center gap-2">
        <select
          value={reportLang}
          onChange={(e) => setReportLang(e.target.value as "es" | "en")}
          disabled={isGenerating}
          className="h-9 text-xs rounded-md border border-slate-300 bg-white px-2 text-slate-700"
          title="Idioma del reporte"
        >
          <option value="es">🇪🇸 Español</option>
          <option value="en">🇺🇸 English</option>
        </select>
        {sessions.length > 0 && (
          <select
            value={reportScope}
            onChange={(e) => setReportScope(e.target.value)}
            disabled={isGenerating}
            className="h-9 text-xs rounded-md border border-slate-300 bg-white px-2 text-slate-700 max-w-[180px]"
            title="Alcance del reporte"
          >
            <option value="">Todo el congreso</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        )}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="sm"
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generar Resumen
            </>
          )}
        </Button>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card className="bg-slate-50 border-dashed border-2">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="bg-white p-3 rounded-full shadow-sm mb-4">
              <Sparkles className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm max-w-xs">
              Aún no has generado ningún esquema académico para este congreso.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col">
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 transition-colors py-4"
                  onClick={() => !isRenaming && setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-teal-50 rounded-lg shrink-0">
                        <Sparkles className="h-4 w-4 text-teal-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {isRenaming === report.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={tempTitle}
                              onChange={(e) => setTempTitle(e.target.value)}
                              className="text-sm font-semibold text-slate-900 border-b border-teal-500 focus:outline-none bg-transparent w-full"
                              autoFocus
                            />
                            <button onClick={() => handleSaveRename(report.id)} className="text-emerald-600 hover:text-emerald-700 p-1">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setIsRenaming(null)} className="text-slate-400 hover:text-slate-500 p-1">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <CardTitle className="text-sm font-bold text-slate-900 truncate">
                            {report.title}
                          </CardTitle>
                        )}
                        <CardDescription className="text-[10px] flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span suppressHydrationWarning>
                            {new Date(report.created_at).toLocaleDateString("es-CO", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                      {expandedReportId === report.id && !isEditing && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleStartRename(report)}
                            title="Renombrar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setConfirmDelete(report.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {expandedReportId === report.id ? (
                        <ChevronUp className="h-4 w-4 text-slate-400 ml-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {confirmDelete === report.id && (
                  <div className="bg-red-50 border-y border-red-100 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-200">
                    <p className="text-xs font-medium text-red-700 flex items-center gap-2">
                      <Trash2 className="h-3.5 w-3.5" />
                      ¿Seguro que quieres eliminar este reporte?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-slate-500 hover:bg-red-100/50"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs bg-red-600 hover:bg-red-700"
                        onClick={() => handleDeleteReport(report.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : "Eliminar definitivamente"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {expandedReportId === report.id && (
                <CardContent className="pt-0 pb-6 border-t border-slate-50 mt-2">
                  <div className="flex justify-end mb-4 pt-4">
                    {isEditing === report.id ? (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(null)}
                          className="text-slate-500"
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(report.id)}
                          disabled={isSaving}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Guardar Cambios
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(report)}
                        className="text-slate-600 hover:bg-slate-50"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar Contenido
                      </Button>
                    )}
                  </div>

                  {isEditing === report.id ? (
                    <textarea
                      value={tempContent}
                      onChange={(e) => setTempContent(e.target.value)}
                      className="w-full min-h-[400px] p-4 text-sm font-sans border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none leading-relaxed text-slate-700 bg-slate-50/30"
                      placeholder="Escribe el contenido del reporte..."
                    />
                  ) : (
                    <div className="prose prose-slate prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h1 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-bold text-teal-800 mt-8 mb-3">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-md font-bold text-slate-800 mt-6 mb-2">{children}</h3>,
                          table: ({ children }) => (
                            <div className="my-6 overflow-x-auto rounded-lg border border-slate-200">
                              <table className="w-full text-left border-collapse">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
                          th: ({ children }) => <th className="px-4 py-3 font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">{children}</th>,
                          td: ({ children }) => (
                            <td className="px-4 py-3 border-t border-slate-100 text-slate-600 first:pl-6 last:pr-6">
                              {children}
                            </td>
                          ),
                          p: ({ children }) => {
                            if (typeof children === "string") {
                              const parts = children.split(/(\[foto:\d+\]|\[ref:[^\]]+\]|\*\*⚠️ ALERTA: ESTUDIO RETRACTADO\*\*)/g)
                              return (
                                <p className="leading-relaxed mb-4 last:mb-0">
                                  {parts.map((part, i) => {
                                    if (part === "**⚠️ ALERTA: ESTUDIO RETRACTADO**") {
                                      return (
                                        <span key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold">
                                          ⚠️ ALERTA: ESTUDIO RETRACTADO
                                        </span>
                                      )
                                    }

                                    const fotoMatch = part.match(/\[foto:(\d+)\]/)
                                    if (fotoMatch) {
                                      const num = fotoMatch[1]
                                      return (
                                        <button
                                          key={i}
                                          onClick={() => {
                                            const element = document.getElementById(`photo-${num}`)
                                            if (element) element.scrollIntoView({ behavior: "smooth", block: "center" })
                                          }}
                                          className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold hover:bg-blue-100 transition-colors mx-0.5"
                                        >
                                          FOTO {num}
                                        </button>
                                      )
                                    }

                                    const refMatch = part.match(/\[ref:([^\]]+)\]/)
                                    if (refMatch) {
                                      const refTitle = refMatch[1]
                                      return (
                                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium italic mx-0.5">
                                          {refTitle}
                                        </span>
                                      )
                                    }

                                    return part
                                  })}
                                </p>
                              )
                            }
                            return <p className="leading-relaxed mb-4 last:mb-0">{children}</p>
                          }
                        }}
                      >
                        {report.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
