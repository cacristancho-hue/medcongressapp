"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const MAX_PHOTOS_PER_CONGRESS = 100
const MAX_FILE_SIZE = 20 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
])

export async function deleteImage(
  imageId: string,
  storagePath: string,
  congressId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { data: image } = await supabase
    .from("congress_images")
    .select("user_id, storage_path, storage_path_optimized, storage_path_thumbnail")
    .eq("id", imageId)
    .single()

  if (!image || image.user_id !== user.id) return { error: "No autorizado" }

  const { error: dbErr } = await supabase
    .from("congress_images")
    .delete()
    .eq("id", imageId)

  if (dbErr) return { error: "Error al eliminar el registro. Intenta de nuevo." }

  const storagePaths = Array.from(
    new Set(
      [image.storage_path, image.storage_path_optimized, image.storage_path_thumbnail, storagePath]
        .filter((path): path is string => Boolean(path))
    )
  )

  const { error: storageErr } = await supabase.storage
    .from("congress-photos")
    .remove(storagePaths)

  if (storageErr) {
    console.error("Storage delete failed for:", storagePaths, storageErr)
  }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  return {}
}

// Batch delete: single round-trip for many photos.
// Validates ownership of every id, removes Storage objects in one call,
// removes DB rows in one query, revalidates the congress page.
export async function deleteImages(
  imageIds: string[],
  congressId: string
): Promise<{ error?: string; deleted?: number }> {
  if (imageIds.length === 0) return { deleted: 0 }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  // Pull only rows the user owns under this congress; this is the ownership gate.
  const { data: rows, error: fetchErr } = await supabase
    .from("congress_images")
    .select("id, storage_path, storage_path_optimized, storage_path_thumbnail")
    .in("id", imageIds)
    .eq("user_id", user.id)
    .eq("congress_id", congressId)

  if (fetchErr) return { error: "No se pudieron leer las fotos a eliminar." }

  const ownedIds = (rows ?? []).map((r) => r.id)
  if (ownedIds.length === 0) return { error: "Ninguna foto pertenece a esta cuenta." }

  // Collect every storage path (original + optimized + thumb) for the bulk remove.
  const storagePaths = Array.from(
    new Set(
      (rows ?? []).flatMap((r) => [
        r.storage_path,
        r.storage_path_optimized,
        r.storage_path_thumbnail,
      ])
        .filter((p): p is string => Boolean(p))
    )
  )

  const { error: dbErr } = await supabase
    .from("congress_images")
    .delete()
    .in("id", ownedIds)

  if (dbErr) return { error: "Error al eliminar las fotos. Intenta de nuevo." }

  if (storagePaths.length > 0) {
    const { error: storageErr } = await supabase.storage
      .from("congress-photos")
      .remove(storagePaths)
    if (storageErr) {
      console.error("Storage batch delete failed:", storagePaths.length, "paths,", storageErr)
    }
  }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  return { deleted: ownedIds.length }
}

export async function registerImage(payload: {
  id: string
  congress_id: string
  user_id: string
  storage_path: string
  storage_path_optimized: string
  storage_path_thumbnail: string
  width_original: number
  height_original: number
  width_optimized: number
  height_optimized: number
  width_thumbnail: number
  height_thumbnail: number
  size_original_bytes: number
  size_optimized_bytes: number
  size_thumbnail_bytes: number
  compression_quality: number
  compression_ratio: number
  mime_type_original: string
  mime_type_optimized: string
  mime_type_thumbnail: string
  upload_status: string
  external_sync_status: string
  ocr_status: string
  ai_status: string
  upload_error?: string | null
  original_filename: string
  file_size: number
  mime_type: string
  file_hash?: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== payload.user_id) {
    return { error: "No autorizado" }
  }

  if (payload.file_size > MAX_FILE_SIZE || !ALLOWED_MIME_TYPES.has(payload.mime_type_original)) {
    return { error: "Archivo no permitido. Usa una imagen compatible de máximo 20 MB." }
  }

  const { data: congress } = await supabase
    .from("congresses")
    .select("id")
    .eq("id", payload.congress_id)
    .eq("user_id", user.id)
    .single()

  if (!congress) {
    return { error: "No autorizado" }
  }

  const { count } = await supabase
    .from("congress_images")
    .select("id", { count: "exact", head: true })
    .eq("congress_id", payload.congress_id)
    .eq("user_id", user.id)

  if ((count ?? 0) >= MAX_PHOTOS_PER_CONGRESS) {
    return { error: "Límite alcanzado: 100 fotos por congreso." }
  }

  const { error } = await supabase.from("congress_images").insert({
    id: payload.id,
    congress_id: payload.congress_id,
    user_id: payload.user_id,
    storage_path: payload.storage_path,
    storage_path_optimized: payload.storage_path_optimized,
    storage_path_thumbnail: payload.storage_path_thumbnail,
    width_original: payload.width_original,
    height_original: payload.height_original,
    width_optimized: payload.width_optimized,
    height_optimized: payload.height_optimized,
    width_thumbnail: payload.width_thumbnail,
    height_thumbnail: payload.height_thumbnail,
    size_original_bytes: payload.size_original_bytes,
    size_optimized_bytes: payload.size_optimized_bytes,
    size_thumbnail_bytes: payload.size_thumbnail_bytes,
    compression_quality: payload.compression_quality,
    compression_ratio: payload.compression_ratio,
    mime_type_original: payload.mime_type_original,
    mime_type_optimized: payload.mime_type_optimized,
    mime_type_thumbnail: payload.mime_type_thumbnail,
    upload_status: payload.upload_status,
    external_sync_status: payload.external_sync_status,
    ocr_status: payload.ocr_status,
    ai_status: payload.ai_status,
    upload_error: payload.upload_error ?? null,
    image_order: 0,
    status: "uploaded",
    file_size: payload.size_optimized_bytes,
    mime_type: payload.mime_type_optimized,
    original_filename: payload.original_filename,
    file_hash: payload.file_hash,
  })

  if (error) {
    console.error("Error registering image:", error)
    return { error: "Error al registrar la imagen en la base de datos" }
  }

  return {}
}
