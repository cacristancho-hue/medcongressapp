"use server"

import { revalidatePath } from "next/cache"
import { withAction } from "@/lib/with-action"
import type { CongressSession } from "@/types/database"

// Ownership helper: confirms the congress belongs to the user. Sessions inherit
// their access from the parent congress (plus their own user_id under RLS).
async function assertCongressOwnership(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  congressId: string
) {
  const { data } = await supabase
    .from("congresses")
    .select("id")
    .eq("id", congressId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!data) throw new Error("Congreso no encontrado o no autorizado")
}

export interface CreateSessionInput {
  congressId: string
  title: string
  speaker?: string | null
  room?: string | null
  sessionDate?: string | null
  startsAt?: string | null
}

export const createSession = withAction({
  name: "session.create",
})(async ({ user, supabase }, input: CreateSessionInput) => {
  await assertCongressOwnership(supabase, user.id, input.congressId)

  const title = input.title?.trim()
  if (!title) throw new Error("El título de la sesión es obligatorio")

  // New sessions go to the end of the manual order.
  const { data: last } = await supabase
    .from("congress_sessions")
    .select("session_order")
    .eq("congress_id", input.congressId)
    .order("session_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextOrder = (last?.session_order ?? -1) + 1

  const { data, error } = await supabase
    .from("congress_sessions")
    .insert({
      congress_id: input.congressId,
      user_id: user.id,
      title,
      speaker: input.speaker?.trim() || null,
      room: input.room?.trim() || null,
      session_date: input.sessionDate || null,
      starts_at: input.startsAt || null,
      session_order: nextOrder,
    })
    .select("id")
    .single()

  if (error) throw new Error(`No se pudo crear la sesión: ${error.message}`)

  revalidatePath(`/dashboard/congresos/${input.congressId}`)
  return { sessionId: data.id as string }
})

export interface UpdateSessionInput {
  id: string
  congressId: string
  updates: Partial<Pick<CongressSession, "title" | "speaker" | "room" | "session_date" | "starts_at" | "session_order">>
}

export const updateSession = withAction({
  name: "session.update",
})(async ({ user, supabase }, input: UpdateSessionInput) => {
  if ("title" in input.updates && !input.updates.title?.trim()) {
    throw new Error("El título de la sesión no puede quedar vacío")
  }

  const { error } = await supabase
    .from("congress_sessions")
    .update({ ...input.updates, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("user_id", user.id)

  if (error) throw new Error(`No se pudo actualizar la sesión: ${error.message}`)

  revalidatePath(`/dashboard/congresos/${input.congressId}`)
  return { updated: true }
})

export interface DeleteSessionInput {
  id: string
  congressId: string
}

export const deleteSession = withAction({
  name: "session.delete",
})(async ({ user, supabase }, input: DeleteSessionInput) => {
  // Images keep their data; their session_id is set to null by the FK
  // (ON DELETE SET NULL), so they fall back to "Sin asignar".
  const { error } = await supabase
    .from("congress_sessions")
    .delete()
    .eq("id", input.id)
    .eq("user_id", user.id)

  if (error) throw new Error(`No se pudo eliminar la sesión: ${error.message}`)

  revalidatePath(`/dashboard/congresos/${input.congressId}`)
  return { deleted: true }
})

export interface AssignImagesInput {
  congressId: string
  imageIds: string[]
  // null = unassign (move back to "Sin asignar")
  sessionId: string | null
}

export const assignImagesToSession = withAction({
  name: "session.assign_images",
})(async ({ user, supabase }, input: AssignImagesInput) => {
  if (input.imageIds.length === 0) return { assigned: 0 }

  // If assigning to a session, verify it belongs to the user and congress.
  if (input.sessionId) {
    const { data: session } = await supabase
      .from("congress_sessions")
      .select("id")
      .eq("id", input.sessionId)
      .eq("congress_id", input.congressId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!session) throw new Error("Sesión no encontrada o no autorizada")
  }

  // Ownership gate on the images themselves (user_id + congress).
  const { data: owned } = await supabase
    .from("congress_images")
    .select("id")
    .in("id", input.imageIds)
    .eq("user_id", user.id)
    .eq("congress_id", input.congressId)

  const ownedIds = (owned ?? []).map((r) => r.id)
  if (ownedIds.length === 0) throw new Error("Ninguna imagen pertenece a esta cuenta")

  const { error } = await supabase
    .from("congress_images")
    .update({ session_id: input.sessionId })
    .in("id", ownedIds)

  if (error) throw new Error(`No se pudieron asignar las imágenes: ${error.message}`)

  revalidatePath(`/dashboard/congresos/${input.congressId}`)
  return { assigned: ownedIds.length }
})
