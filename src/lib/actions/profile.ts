"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/types/database"

const VALID_ROLES = new Set<UserRole>(["resident", "fellow", "specialist", "professor"])

function optionalText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : ""
  return text.length > 0 ? text : null
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const roleValue = optionalText(formData.get("role"))
  const role = roleValue && VALID_ROLES.has(roleValue as UserRole) ? roleValue : null

  const { error } = await supabase
    .from("profiles")
    .upsert({
      user_id: user.id,
      full_name: optionalText(formData.get("full_name")),
      role,
      specialty: optionalText(formData.get("specialty")),
      country: optionalText(formData.get("country")),
    }, { onConflict: "user_id" })

  if (error) {
    throw new Error("No se pudo guardar el perfil. Intenta de nuevo.")
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/ajustes")
}
