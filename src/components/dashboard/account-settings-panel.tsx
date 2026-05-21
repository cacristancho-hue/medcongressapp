"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { updateProfile } from "@/lib/actions/profile"
import type { AiUsageLimits, Profile } from "@/types/database"
import { getPlanDefaults } from "@/lib/plan-limits"
import { toast } from "sonner"

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
  { value: "private", label: "Clínica privada" },
  { value: "public", label: "Hospital público" },
  { value: "both", label: "Ambos (público y privado)" },
]

interface AccountSettingsPanelProps {
  profile: Profile | null
  currentEmail: string
  aiLimits: Pick<AiUsageLimits, "plan" | "monthly_image_quota" | "monthly_report_quota"> | null
}

function formatPlan(plan?: string | null) {
  if (!plan) return "Sin plan detectado"
  switch (plan) {
    case "free":
      return "Free"
    case "congress":
      return "Congress"
    case "academic":
      return "Academic"
    case "enterprise":
      return "Enterprise"
    case "admin":
      return "Admin"
    default:
      return plan
  }
}

export default function AccountSettingsPanel({ profile, currentEmail, aiLimits }: AccountSettingsPanelProps) {
  const router = useRouter()
  const [profileLoading, setProfileLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [nextEmail, setNextEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const planDefaults = getPlanDefaults(aiLimits?.plan)
  const visibleImageQuota = aiLimits?.monthly_image_quota && aiLimits.monthly_image_quota > 0
    ? aiLimits.monthly_image_quota
    : planDefaults.imageQuota
  const visibleReportQuota = aiLimits?.monthly_report_quota && aiLimits.monthly_report_quota > 0
    ? aiLimits.monthly_report_quota
    : planDefaults.reportQuota

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await updateProfile(formData)
      if (result?.success) {
        toast.success(result.message ?? "Perfil actualizado correctamente.")
        router.refresh()
      } else {
        toast.error(result?.error ?? "No se pudo guardar el perfil.")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el perfil.")
    } finally {
      setProfileLoading(false)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEmailLoading(true)

    try {
      const email = nextEmail.trim()
      if (!email) {
        toast.error("Escribe un correo nuevo.")
        return
      }
      if (email.toLowerCase() === currentEmail.toLowerCase()) {
        toast.info("Ese correo ya es el actual.")
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ email })
      if (error) {
        toast.error(error.message)
        return
      }

      toast.success("Enviamos un correo de confirmación al nuevo email.")
      setNextEmail("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el correo.")
    } finally {
      setEmailLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordLoading(true)

    try {
      if (!newPassword || newPassword.length < 8) {
        toast.error("La nueva contraseña debe tener al menos 8 caracteres.")
        return
      }
      if (newPassword !== confirmPassword) {
        toast.error("Las contraseñas no coinciden.")
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error(error.message)
        return
      }

      toast.success("Contraseña actualizada correctamente.")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la contraseña.")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-slate-200 bg-slate-950 text-white shadow-sm overflow-hidden">
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-white/80">Plan detectado</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Plan</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatPlan(aiLimits?.plan)}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Fotos / mes</p>
              <p className="mt-1 text-sm font-semibold text-white">{visibleImageQuota}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Reportes / mes</p>
              <p className="mt-1 text-sm font-semibold text-white">{visibleReportQuota}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/60">
            Este plan define el comportamiento de subida y el límite de uso de IA.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-slate-50/70 shadow-sm overflow-hidden">
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-wider">Datos actuales</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Nombre</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile?.full_name ?? "Sin nombre registrado"}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Correo</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 break-all">{currentEmail}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Especialidad</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile?.specialty ?? "Sin especialidad registrada"}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Nivel</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile?.role ?? "Sin nivel registrado"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-50 py-5">
          <CardTitle className="text-base font-bold text-slate-900 uppercase tracking-wider">Perfil profesional</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nombre completo</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile?.full_name ?? ""}
                  placeholder="Nombre completo"
                  className="rounded-xl border-slate-200 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nivel</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue={profile?.role ?? ""}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-slate-700"
                >
                  <option value="">Seleccionar nivel</option>
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <p className="px-1 text-[11px] text-slate-500">
                  Puedes corregir o ajustar tu nivel profesional desde aquí.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialty" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Especialidad</Label>
              <Input
                id="specialty"
                name="specialty"
                defaultValue={profile?.specialty ?? ""}
                placeholder="Especialidad médica"
                className="rounded-xl border-slate-200 focus:ring-blue-600"
              />
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
                <Label htmlFor="workplace_type" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Lugar de trabajo</Label>
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
              <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">País</Label>
              <Input
                id="country"
                name="country"
                defaultValue={profile?.country ?? ""}
                placeholder="País de residencia"
                className="rounded-xl border-slate-200 focus:ring-blue-600"
              />
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-end">
              <Button
                type="submit"
                loading={profileLoading}
                className="bg-blue-600 hover:bg-slate-900 text-white font-black uppercase tracking-widest rounded-xl px-8 h-11 transition-all shadow-md"
              >
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-50 py-5">
          <CardTitle className="text-base font-bold text-slate-900 uppercase tracking-wider">Cuenta y acceso</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current_email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Correo actual</Label>
              <Input
                id="current_email"
                value={currentEmail}
                disabled
                className="rounded-xl border-slate-200 bg-slate-50 text-slate-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next_email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nuevo correo</Label>
              <Input
                id="next_email"
                type="email"
                value={nextEmail}
                onChange={(e) => setNextEmail(e.target.value)}
                placeholder="nuevo@correo.com"
                className="rounded-xl border-slate-200 focus:ring-blue-600"
              />
            </div>
            <p className="text-xs text-slate-500">
              Si cambias tu correo, Supabase enviará un enlace de confirmación al nuevo email.
            </p>
            <div className="flex justify-end">
              <Button
                type="submit"
                loading={emailLoading}
                variant="outline"
                className="rounded-xl border-slate-200 font-bold"
              >
                Actualizar correo
              </Button>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-8">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new_password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nueva contraseña</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="rounded-xl border-slate-200 focus:ring-blue-600"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm_password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Confirmar contraseña</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="rounded-xl border-slate-200 focus:ring-blue-600"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={passwordLoading}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  Cambiar contraseña
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
