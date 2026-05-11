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
import { ShieldCheck, UserPlus } from "lucide-react"

const SPECIALTIES = [
  "Alergología",
  "Dermatología",
  "Neumología",
  "Pediatría",
  "Medicina interna",
  "Otra",
]

const ROLES = [
  { value: "resident", label: "Residente" },
  { value: "fellow", label: "Fellow" },
  { value: "specialist", label: "Especialista" },
  { value: "professor", label: "Profesor clínico" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "",
    specialty: "",
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

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
          role: formData.role,
          specialty: formData.specialty,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-4 py-12">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#f1f5f9_0%,_transparent_50%)]"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10 group">
          <Logo className="h-16 w-16 md:h-20 md:w-20 mb-4" />
          <div className="text-center">
            <h1 className="text-xl font-black tracking-[0.3em] text-slate-900 uppercase font-plex-mono leading-none">
              MDCONGRESS
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
              Estructurando conocimiento médico
            </p>
          </div>
        </div>

        <Card className="border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-50 pb-8 pt-10 px-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Crear cuenta</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-2">
              Inicie su registro para acceder a reportes técnicos y bibliografía.
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
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo institucional</Label>
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
              
              <div className="space-y-2">
                <Label htmlFor="password" university-tag="true" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contraseña segura</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="rounded-xl border-slate-200 focus:ring-blue-600 h-11"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nivel</Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-slate-700"
                  >
                    <option value="">Seleccionar</option>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Especialidad</Label>
                  <select
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-slate-700"
                  >
                    <option value="">Seleccionar</option>
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
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
                  ¿Ya es parte de MDCONGRESS?{" "}
                  <Link href="/login" className="text-blue-600 font-black hover:underline uppercase tracking-tighter">
                    Iniciar Sesión
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
          Al registrarse, usted acepta nuestros <Link href="/terms" className="underline">Términos</Link> y <Link href="/privacy" className="underline">Política de Privacidad</Link>.
        </p>
      </div>
    </div>
  )
}
