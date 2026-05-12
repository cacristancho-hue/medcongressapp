"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { softDeleteCongress } from "@/lib/actions/congresses"
import { toast } from "sonner"
import { clsx } from "clsx"

interface Props {
  congressId: string
  congressName: string
  showText?: boolean
}

export default function DeleteCongressButton({ congressId, congressName, showText }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el congreso "${congressName}"? Esta acción lo moverá a la papelera.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await softDeleteCongress(congressId)
      if (result.success) {
        toast.success("Congreso eliminado correctamente")
        if (window.location.pathname.includes(congressId)) {
          window.location.href = "/dashboard/congresos"
        }
      } else {
        toast.error(result.error || "Error al eliminar el congreso")
        setIsDeleting(false)
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado")
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className={clsx(
        "transition-colors h-8 px-2 flex items-center gap-2",
        showText 
          ? "text-red-600 bg-red-50 hover:bg-red-100 border border-red-100" 
          : "text-slate-400 hover:text-red-600 hover:bg-red-50"
      )}
      title="Eliminar congreso"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {showText && <span className="text-[10px] font-black uppercase tracking-widest">Eliminar Congreso</span>}
    </Button>
  )
}
