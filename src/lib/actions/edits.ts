"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateReportContent(
  reportId: string,
  congressId: string,
  content: string
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { error } = await supabase
    .from("reports")
    .update({ content })
    .eq("id", reportId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error updating report:", error)
    return { error: "No se pudo guardar el reporte" }
  }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  return { success: true, message: "Reporte guardado correctamente" }
}

export async function updateReportTitle(
  reportId: string,
  congressId: string,
  title: string
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { error } = await supabase
    .from("reports")
    .update({ title })
    .eq("id", reportId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error updating report title:", error)
    return { error: "No se pudo actualizar el nombre del reporte" }
  }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  return { success: true, message: "Nombre del reporte actualizado" }
}

export async function deleteReport(
  reportId: string,
  congressId: string
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", reportId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error deleting report:", error)
    return { error: "No se pudo eliminar el reporte" }
  }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  return { success: true, message: "Reporte eliminado" }
}

export async function updateImageAnalysis(
  imageId: string,
  congressId: string,
  payload: {
    raw_text?: string
    cleaned_text?: string
  }
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { error } = await supabase
    .from("ocr_results")
    .update(payload)
    .eq("image_id", imageId)

  if (error) {
    console.error("Error updating OCR results:", error)
    return { error: "No se pudieron guardar los cambios" }
  }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  return { success: true, message: "Análisis actualizado con éxito" }
}
