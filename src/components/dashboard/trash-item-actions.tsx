"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { RotateCcw, Trash2 } from "lucide-react"
import { restoreItem, purgeItem } from "@/lib/actions/trash"
import type { SoftDeletableTable } from "@/lib/soft-delete"

interface Props {
  table: Extract<SoftDeletableTable, "congresses" | "congress_images" | "reports">
  id: string
}

export default function TrashItemActions({ table, id }: Props) {
  const t = useTranslations("ui")
  const [pending, startTransition] = useTransition()

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreItem({ table, id })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(t("restored"))
    })
  }

  function handlePurge() {
    if (!confirm(t("deleteForeverConfirm"))) return
    startTransition(async () => {
      const result = await purgeItem({ table, id })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(t("deletedForever"))
    })
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={handleRestore}
        disabled={pending}
        title={t("restore")}
        className="rounded p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={handlePurge}
        disabled={pending}
        title={t("deleteForever")}
        className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
