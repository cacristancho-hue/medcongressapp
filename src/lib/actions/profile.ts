"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/types/database"

const VALID_ROLES = new Set<UserRole>(["student", "resident", "fellow", "specialist", "professor"])

function optionalText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : ""
  return text.length > 0 ? text : null
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const roleValue = optionalText(formData.get("role"))
  const role = roleValue && (VALID_ROLES as any).has(roleValue) ? (roleValue as UserRole) : null
  
  const ageValue = formData.get("age")
  const parsedAge = ageValue ? Number(ageValue.toString()) : null
  const age = parsedAge !== null && Number.isFinite(parsedAge) ? parsedAge : null

  const payload = {
    user_id: user.id,
    full_name: optionalText(formData.get("full_name")),
    role,
    specialty: optionalText(formData.get("specialty")),
    country: optionalText(formData.get("country")),
    age,
    gender: optionalText(formData.get("gender")),
    workplace_type: optionalText(formData.get("workplace_type")),
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })

  if (error) {
    const roleConstraintError =
      Boolean(role) &&
      (error.code === "23514" || error.message.toLowerCase().includes("profiles_role_check"))

    if (roleConstraintError) {
      const { role: _ignoredRole, ...payloadWithoutRole } = payload
      const retry = await supabase
        .from("profiles")
        .upsert(payloadWithoutRole, { onConflict: "user_id" })

      if (!retry.error) {
        revalidatePath("/dashboard")
        revalidatePath("/dashboard/ajustes")

        return {
          success: true,
          message: "Perfil actualizado correctamente. El nivel no se pudo guardar porque falta aplicar la migracion de roles en la base de datos.",
        }
      }
    }

    return { success: false, error: "No se pudo guardar el perfil. Intenta de nuevo." }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/ajustes")

  return { success: true, message: "Perfil actualizado correctamente." }
}
