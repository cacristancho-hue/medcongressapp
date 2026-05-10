"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { RotateCcw, Trash2 } from "lucide-react"
import { restoreItem, purgeItem } from "@/lib/actions/trash"
import type { SoftDeletableTable } from "@/lib/soft-delete"

interface Props {
  table: Extract<SoftDeletableTable, "congresses" | "congress_images" | "reports">
  id: string
}

export default function TrashItemActions({ table, id }: Props) {
  const [pending, startTransition] = useTransition()

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreItem({ table, id })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Restaurado")
    })
  }

  function handlePurge() {
    if (!confirm("Eliminar definitivamente. Esta acción no se puede deshacer.")) return
    startTransition(async () => {
      const result = await purgeItem({ table, id })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Eliminado definitivamente")
    })
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={handleRestore}
        disabled={pending}
        title="Restaurar"
        className="rounded p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={handlePurge}
        disabled={pending}
        title="Eliminar definitivamente"
        className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
