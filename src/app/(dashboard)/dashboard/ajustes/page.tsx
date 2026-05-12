import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/server"
import { updateProfile } from "@/lib/actions/profile"

import { MEDICAL_SPECIALTIES_RETHUS } from "@/lib/constants/medical-specialties"

const ROLES = [
  { value: "student", label: "Estudiante de Medicina" },
  { value: "resident", label: "Residente" },
  { value: "fellow", label: "Fellow" },
  { value: "specialist", label: "Especialista" },
  { value: "professor", label: "Profesor clínico" },
]

const GENDERS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "O", label: "Otro" },
]

const WORKPLACE_TYPES = [
  { value: "private", label: "Clínica Privada" },
  { value: "public", label: "Hospital Público" },
  { value: "both", label: "Ambos (Público y Privado)" },
]

export default async function AjustesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, specialty, country, age, gender, workplace_type")
    .eq("user_id", user.id)
    .single()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Ajustes</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Perfil médico profesional para personalización académica.</p>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-50 py-5">
          <CardTitle className="text-base font-bold text-slate-900 uppercase tracking-wider">Perfil profesional</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form action={updateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nombre completo</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile?.full_name ?? ""}
                  placeholder="Ej: Maria Fernanda Perez"
                  className="rounded-xl border-slate-200 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">NIVEL</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue={profile?.role ?? ""}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-slate-700"
                >
                  <option value="">Seleccionar rol</option>
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialty" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Especialidad (RETHUS)</Label>
              <input
                list="specialties-list"
                id="specialty"
                name="specialty"
                defaultValue={profile?.specialty ?? ""}
                placeholder="Ej. Medicina Interna"
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-slate-700"
              />
              <datalist id="specialties-list">
                {MEDICAL_SPECIALTIES_RETHUS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="age" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Edad</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  defaultValue={profile?.age ?? ""}
                  placeholder="Años"
                  className="rounded-xl border-slate-200 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Sexo</Label>
                <select
                  id="gender"
                  name="gender"
                  defaultValue={profile?.gender ?? ""}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-slate-700"
                >
                  <option value="">Seleccionar</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workplace_type" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Lugar de Trabajo</Label>
                <select
                  id="workplace_type"
                  name="workplace_type"
                  defaultValue={profile?.workplace_type ?? ""}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-slate-700"
                >
                  <option value="">Seleccionar</option>
                  {WORKPLACE_TYPES.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Pais</Label>
              <Input
                id="country"
                name="country"
                defaultValue={profile?.country ?? ""}
                placeholder="Ej: Colombia"
                className="rounded-xl border-slate-200 focus:ring-blue-600"
              />
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-slate-900 text-white font-black uppercase tracking-widest rounded-xl px-8 h-11 transition-all shadow-md">
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
