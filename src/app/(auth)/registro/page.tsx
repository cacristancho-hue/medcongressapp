"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Logo from "@/components/ui/md-logo"
import { ShieldCheck } from "lucide-react"

import { MEDICAL_SPECIALTIES_RETHUS } from "@/lib/constants/medical-specialties"

const ROLES = [
  { value: "student", label: "Estudiante de Medicina" },
  { value: "resident", label: "Residente" },
  { value: "fellow", label: "Fellow" },
  { value: "specialist", label: "Especialista" },
  { value: "professor", label: "Profesor clinico" },
]

const GENDERS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "O", label: "Otro" },
]

const WORKPLACE_TYPES = [
  { value: "private", label: "Clinica Privada" },
  { value: "public", label: "Hospital Publico" },
  { value: "both", label: "Ambos (Publico y Privado)" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "",
    specialty: "",
    age: "",
    gender: "",
    workplace_type: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const age = parseInt(formData.age)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: formData.full_name,
          role: formData.role,
          specialty: formData.specialty,
          age: isNaN(age) ? null : age,
          gender: formData.gender,
          workplace_type: formData.workplace_type,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push("/dashboard")
      router.refresh()
      return
    }

    const email = encodeURIComponent(formData.email)
    router.push(`/login?registered=1&email=${email}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#f1f5f9_0%,_transparent_50%)]"></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="flex flex-col items-center mb-10 group cursor-default">
          <div className="transform hover:scale-105 transition-transform duration-700">
            <Logo className="h-20 w-20" />
          </div>
          <div className="mt-[-8px] relative overflow-hidden">
            <h1 className="text-2xl font-black tracking-[0.5em] text-black uppercase font-plex-mono leading-none py-1">
              CONGRESS
            </h1>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_10s_infinite] skew-x-[-20deg]"></div>
          </div>
          <div className="w-10 h-0.5 bg-blue-600 mt-1 rounded-full opacity-20"></div>
        </div>

        <Card className="border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-50 pb-8 pt-10 px-8 text-center">
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase font-plex-mono">Crear cuenta</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-2">
              Estructurando conocimiento medico.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleRegister}>
            <CardContent className="space-y-5 p-8">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600 font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre completo</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="Ej. Dr. Camilo Cristancho"
                    className="rounded-xl border-slate-200 focus:ring-blue-600 h-11"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo electronico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="medico@ejemplo.com"
                    className="rounded-xl border-slate-200 focus:ring-blue-600 h-11"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contrasena segura</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Minimo 8 caracteres"
                    className="rounded-xl border-slate-200 focus:ring-blue-600 h-11"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-slate-400">NIVEL</Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-slate-700"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Especialidad (Escriba para filtrar)</Label>
                <input
                  list="specialties-list"
                  id="specialty"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="Ej. Medicina Interna"
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-slate-700"
                  required
                />
                <datalist id="specialties-list">
                  {MEDICAL_SPECIALTIES_RETHUS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Edad (Opcional)</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    placeholder="Anos"
                    className="rounded-xl border-slate-200 focus:ring-blue-600 h-11"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sexo (Opcional)</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-slate-700"
                  >
                    <option value="">Seleccionar</option>
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workplace_type" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lugar de Trabajo (Opcional)</Label>
                  <select
                    id="workplace_type"
                    name="workplace_type"
                    value={formData.workplace_type}
                    onChange={handleChange}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-slate-700"
                  >
                    <option value="">Seleccionar</option>
                    {WORKPLACE_TYPES.map((w) => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-6 p-8 bg-slate-50/30 border-t border-slate-50">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-slate-900 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95"
                loading={loading}
              >
                Registrarme ahora
              </Button>

              <div className="flex flex-col items-center gap-4">
                <p className="text-xs text-slate-500 font-medium">
                  {"¿Ya es parte de MDCONGRESS?"}{" "}
                  <Link href="/login" className="text-blue-600 font-black hover:underline uppercase tracking-tighter">
                    Iniciar Sesion
                  </Link>
                </p>
                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Acceso Seguro MDCONGRESS
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-8 text-center text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
          Al registrarse, usted acepta nuestros <Link href="/terms" className="underline">Terminos</Link> y <Link href="/privacy" className="underline">Politica de Privacidad</Link>.
        </p>
      </div>
    </div>
  )
}
