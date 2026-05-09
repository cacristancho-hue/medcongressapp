"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, Loader2, CheckCircle2, XCircle, Minus } from "lucide-react"
import { runMedicalAssistant, type AssistantStep } from "@/lib/actions/assistant"

interface Props {
  congressId: string
  language?: "es" | "en"
}

export default function AiAssistantButton({ congressId, language = "es" }: Props) {
  const [isPending, startTransition] = useTransition()
  const [steps, setSteps] = useState<AssistantStep[] | null>(null)
  const router = useRouter()

  function handleClick() {
    const ok = confirm(
      "El asistente clínico procesará tu congreso con IA: extraerá tópicos, verificará referencias bibliográficas y generará un reporte académico. Esto puede tardar unos minutos. ¿Continuar?"
    )
    if (!ok) return

    startTransition(async () => {
      const result = await runMedicalAssistant(congressId, language)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setSteps(result.steps)
      const ok = result.steps.filter((s) => s.status === "success").length
      const skipped = result.steps.filter((s) => s.status === "skipped").length
      const failed = result.steps.filter((s) => s.status === "error").length
      if (failed > 0) {
        toast.warning(
          `Asistente terminó con avisos: ${ok} OK, ${skipped} omitidas, ${failed} con error.`
        )
      } else {
        toast.success(`Asistente completado: ${ok} OK, ${skipped} omitidas.`)
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2.5 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Procesando con IA…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Iniciar asistencia de inteligencia artificial
          </>
        )}
      </button>

      {isPending && (
        <p className="text-xs text-slate-500">
          Esto puede tardar entre 1 y 5 minutos según la cantidad de fotos.
          No cierres esta ventana.
        </p>
      )}

      {steps && (
        <ul className="space-y-1.5 pt-2 border-t border-slate-100">
          {steps.map((step) => {
            const Icon =
              step.status === "success"
                ? CheckCircle2
                : step.status === "error"
                  ? XCircle
                  : Minus
            const tone =
              step.status === "success"
                ? "text-emerald-600"
                : step.status === "error"
                  ? "text-red-600"
                  : "text-slate-400"
            return (
              <li
                key={step.key}
                className="flex items-start gap-2 text-xs text-slate-700"
              >
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${tone}`} />
                <span>
                  <span className="font-medium">{step.label}</span>
                  {step.detail && (
                    <span className="text-slate-500"> · {step.detail}</span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
