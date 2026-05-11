"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { softDeleteCongress } from "@/lib/actions/congresses"
import { toast } from "sonner"

interface Props {
  congressId: string
  congressName: string
}

export default function DeleteCongressButton({ congressId, congressName }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Estás seguro de que quieres eliminar el congreso "${congressName}"? Esta acción lo moverá a la papelera.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await softDeleteCongress(congressId)
      if (result.success) {
        toast.success("Congreso eliminado correctamente")
        // No redirigimos aquí, revalidatePath se encarga si estuviéramos en la lista,
        // pero como estamos en el detalle que acaba de ser soft-deleted, 
        // el middleware o el propio servidor al revalidar debería sacarnos.
        // Por seguridad, forzamos redirección manual.
        window.location.href = "/dashboard/congresos"
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
      className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors h-8 px-2"
      title="Eliminar congreso"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  )
}
