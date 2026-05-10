"use server"

import { revalidatePath } from "next/cache"
import { withAction } from "@/lib/with-action"
import { restoreFromArchive } from "@/lib/soft-delete"
import type { SoftDeletableTable } from "@/lib/soft-delete"

interface RestoreInput {
  table: SoftDeletableTable
  id: string
}

const ALLOWED_TABLES: Record<SoftDeletableTable, true> = {
  congresses: true,
  congress_images: true,
  reports: true,
  organizations: true,
}

export const restoreItem = withAction({
  name: "admin.override",
  rateLimit: "auth_login",
})(async ({ user }, input: RestoreInput) => {
  if (!ALLOWED_TABLES[input.table]) {
    throw new Error("Tabla no permitida")
  }

  const ok = await restoreFromArchive({
    table: input.table,
    id: input.id,
    userId: user.id,
    auditAction:
      input.table === "congresses"
        ? "congress.update"
        : input.table === "reports"
          ? "report.update"
          : "admin.override",
  })

  if (!ok) throw new Error("No se pudo restaurar el elemento")
  revalidatePath("/dashboard/papelera")
  revalidatePath("/dashboard/congresos")
  return { restored: true }
})

interface PurgeInput {
  table: SoftDeletableTable
  id: string
}

export const purgeItem = withAction({
  name: "admin.override",
  rateLimit: "auth_login",
})(async ({ user, supabase }, input: PurgeInput) => {
  if (!ALLOWED_TABLES[input.table]) {
    throw new Error("Tabla no permitida")
  }

  // Hard delete only of items the user owns AND that are already soft-deleted.
  // RLS + ownership filter is the safety net.
  const { error } = await supabase
    .from(input.table)
    .delete()
    .eq("id", input.id)
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)

  if (error) throw new Error(error.message)

  revalidatePath("/dashboard/papelera")
  return { purged: true }
})
