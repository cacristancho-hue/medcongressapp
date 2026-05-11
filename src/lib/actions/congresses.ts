"use server"

import { revalidatePath } from "next/cache"
import { withAction } from "@/lib/with-action"
import { softDelete } from "@/lib/soft-delete"

export const softDeleteCongress = withAction({
  name: "congress.update",
  rateLimit: "image_analysis", // reusing a reasonable bucket
})(async ({ user }, congressId: string) => {
  const ok = await softDelete({
    table: "congresses",
    id: congressId,
    userId: user.id,
    auditAction: "congress.update",
  })

  if (!ok) throw new Error("No se pudo eliminar el congreso")

  revalidatePath("/dashboard/congresos")
  return { success: true }
})
