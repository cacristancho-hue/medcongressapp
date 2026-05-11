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
import { ShieldCheck, LogIn } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError("Correo o contraseña incorrectos.")
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-4">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#f1f5f9_0%,_transparent_50%)]"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10 group">
          <Logo className="h-16 w-16 md:h-20 md:w-20 mb-4" />
          <div className="text-center">
            <h1 className="text-xl font-black tracking-[0.3em] text-slate-900 uppercase font-plex-mono leading-none">
              MDCONGRESS
            </h1>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-2">
              Plataforma Académica de Élite
            </p>
          </div>
        </div>

        <Card className="border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-50 pb-8 pt-10 px-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-slate-900 rounded-2xl shadow-lg">
                <LogIn className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Iniciar sesión</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-2">
              Bienvenido de nuevo a su centro de control académico.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5 p-8">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600 font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="medico@ejemplo.com"
                  className="rounded-xl border-slate-200 focus:ring-blue-600 h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contraseña</Label>
                  <Link href="/recuperar" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-tighter">
                    ¿Olvidó su clave?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-xl border-slate-200 focus:ring-blue-600 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-6 p-8 bg-slate-50/30 border-t border-slate-50">
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-slate-900 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95" 
                loading={loading}
              >
                Ingresar al Panel
              </Button>
              
              <div className="flex flex-col items-center gap-4">
                <p className="text-xs text-slate-500 font-medium">
                  ¿Aún no tiene cuenta?{" "}
                  <Link href="/registro" className="text-blue-600 font-black hover:underline uppercase tracking-tighter">
                    Crear Cuenta Élite
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
      </div>
    </div>
  )
}
