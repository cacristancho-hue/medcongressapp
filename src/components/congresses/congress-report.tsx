"use client"

import { useState, useTransition } from "react"
import { generateAcademicReport } from "@/lib/actions/polyglot-reports"
import { updateReportContent } from "@/lib/actions/edits"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, FileText, Loader2, Calendar, ChevronDown, ChevronUp, Printer, Edit3, Save, X, Languages } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { clsx } from "clsx"
import { toast } from "sonner"

interface Report {
  id: string
  title: string
  content: string
  created_at: string
}

interface Props {
  congressId: string
  reports: Report[]
}

export default function CongressReport({ congressId, reports }: Props) {
  const [isGenerating, startGeneration] = useTransition()
  const [expandedReportId, setExpandedReportId] = useState<string | null>(reports[0]?.id || null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [lang, setLang] = useState<"es" | "en">("es")

  async function handleGenerate() {
    startGeneration(async () => {
      const result = await generateAcademicReport({ congressId, language: lang })
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success("Esquema académico generado con éxito")
      }
    })
  }

  function startEditing(report: Report) {
    setEditingId(report.id)
    setEditContent(report.content)
  }

  async function handleSaveEdit(reportId: string) {
    startGeneration(async () => {
      const result = await updateReportContent(reportId, congressId, editContent)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message)
        setEditingId(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Síntesis Académica Políglota
        </h3>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <div className="flex items-center gap-1 px-2 text-xs font-bold text-slate-500 mr-1">
            <Languages className="h-3.5 w-3.5" /> Salida:
          </div>
          <button 
            onClick={() => setLang("es")}
            className={clsx(
              "px-3 py-1 text-xs font-bold rounded-md transition-all",
              lang === "es" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            ES
          </button>
          <button 
            onClick={() => setLang("en")}
            className={clsx(
              "px-3 py-1 text-xs font-bold rounded-md transition-all",
              lang === "en" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            EN
          </button>
          
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="sm"
            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-bold h-8"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Generar Presentación
              </>
            )}
          </Button>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50">
          <CardContent className="py-10 text-center">
            <div className="bg-white p-3 rounded-full w-fit mx-auto mb-4 shadow-sm border">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 font-medium">Aún no hay esquemas generados</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Analiza tus fotos con IA y genera una estructura lista para PowerPoint en el idioma que prefieras.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden border-slate-200 shadow-sm transition-all print:shadow-none print:border-none">
              <CardHeader
                className="cursor-pointer hover:bg-slate-50 transition-colors py-4 print:hidden"
                onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-800">{report.title}</CardTitle>
                      <CardDescription className="text-[10px] flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.created_at).toLocaleDateString("es-CO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  {expandedReportId === report.id ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </CardHeader>
              {expandedReportId === report.id && (
                <CardContent className="border-t bg-white py-6 print:border-none print:p-0">
                  <div className="flex justify-end gap-2 mb-4 print:hidden">
                    {editingId === report.id ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)} className="text-slate-600">
                          <X className="h-4 w-4 mr-2" /> Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleSaveEdit(report.id)} disabled={isGenerating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          <Save className="h-4 w-4 mr-2" /> Guardar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => startEditing(report)} className="text-slate-600 hover:text-slate-900">
                          <Edit3 className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-slate-600 hover:text-slate-900">
                          <Printer className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </>
                    )}
                  </div>

                  {editingId === report.id ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[400px] p-4 text-sm font-mono border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-slate-800 leading-relaxed"
                    />
                  ) : (
                    <div className="prose prose-slate prose-sm max-w-none 
                      prose-headings:text-slate-900 prose-headings:font-bold
                      prose-p:text-slate-700 prose-p:leading-relaxed
                      prose-strong:text-slate-900
                      prose-ul:list-disc prose-li:my-1 print:prose-base">
                      <ReactMarkdown>{report.content}</ReactMarkdown>
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
