import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/server"
import { updateProfile } from "@/lib/actions/profile"

const ROLES = [
  { value: "resident", label: "Residente" },
  { value: "fellow", label: "Fellow" },
  { value: "specialist", label: "Especialista" },
  { value: "professor", label: "Profesor" },
]

export default async function AjustesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, specialty, country")
    .eq("user_id", user.id)
    .single()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Ajustes</h2>
        <p className="text-sm text-slate-500 mt-1">Perfil medico usado para personalizar congresos y reportes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil profesional</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile?.full_name ?? ""}
                placeholder="Ej: Maria Fernanda Perez"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                name="role"
                defaultValue={profile?.role ?? ""}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="">Seleccionar rol</option>
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                name="specialty"
                defaultValue={profile?.specialty ?? ""}
                placeholder="Ej: Alergologia"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country">Pais</Label>
              <Input
                id="country"
                name="country"
                defaultValue={profile?.country ?? ""}
                placeholder="Ej: Colombia"
              />
            </div>

            <div className="pt-2">
              <Button type="submit">Guardar cambios</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
