"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { reanalyzeCongress } from "@/lib/actions/queue"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  congressId: string
  photoCount: number
}

// Re-analyzes ALL photos (even already-analyzed ones) to regenerate the newer
// pipeline fields (slide_text, image_type, specialty-aware analysis). Costs AI
// credits, so it asks for confirmation.
export default function ReanalyzeButton({ congressId, photoCount }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleReanalyze = () => {
    if (photoCount === 0) {
      toast.error("No hay fotos para re-analizar.")
      return
    }
    if (
      !window.confirm(
        `Re-analizar las ${photoCount} foto(s) de este congreso con el modelo actual. ` +
          `Esto consume créditos de IA y regenera el texto depurado, el tipo de imagen y el análisis por especialidad. ¿Continuar?`
      )
    ) {
      return
    }

    startTransition(async () => {
      try {
        const result = await reanalyzeCongress(congressId)
        if (!result.success) {
          toast.error(result.error)
          return
        }
        if (result.enqueued > 0) {
          toast.success(`Re-análisis encolado para ${result.enqueued} foto(s). Aparecerá actualizado al terminar la cola.`)
          router.refresh()
        } else {
          toast.info(result.message || "No hubo fotos para re-analizar.")
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al re-analizar")
      }
    })
  }

  return (
    <Button
      onClick={handleReanalyze}
      disabled={isPending || photoCount === 0}
      variant="outline"
      size="sm"
      className="h-7 px-2 text-[10px] bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
      title="Vuelve a analizar todas las fotos con el modelo actual"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Encolando...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Re-analizar todo
        </>
      )}
    </Button>
  )
}
