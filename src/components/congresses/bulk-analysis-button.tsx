"use client"

import { useTransition } from "react"
import { enqueueCongressAnalysis } from "@/lib/actions/queue"
import { kickQueuedAiJobs } from "@/lib/worker-kick"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  congressId: string
  photoCount: number
}

export default function BulkAnalysisButton({ congressId, photoCount }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleBulkAnalysis = () => {
    if (photoCount === 0) {
      toast.error("No hay fotos para analizar. Sube algunas primero.")
      return
    }

    startTransition(async () => {
      try {
        const result = await enqueueCongressAnalysis(congressId)
        if (!result.success) {
          toast.error(result.error)
          return
        }

        const processed = typeof (result as { processed?: number }).processed === "number"
          ? (result as { processed?: number }).processed ?? 0
          : 0
        const failed = typeof (result as { failed?: number }).failed === "number"
          ? (result as { failed?: number }).failed ?? 0
          : 0

        if (processed > 0) {
          if (failed > 0) {
            toast.warning(result.message || `Se analizaron ${processed} fotos, ${failed} fallaron.`)
          } else {
            toast.success(result.message || `Se analizaron ${processed} fotos con IA.`)
          }
        } else if (result.enqueued > 0) {
          toast.success(`Se han encolado ${result.enqueued} fotos para analisis por IA.`)
          void kickQueuedAiJobs().catch((error) => {
            console.error("No se pudo activar el worker de IA:", error)
          })
        } else {
          toast.info(result.message || "Todas las fotos ya estan procesadas.")
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al encolar el analisis")
      }
    })
  }

  return (
    <Button
      onClick={handleBulkAnalysis}
      disabled={isPending || photoCount === 0}
      variant="outline"
      size="sm"
      className="h-7 px-2 text-[10px] bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:text-teal-800"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Encolando...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Analizar todo con IA
        </>
      )}
    </Button>
  )
}
