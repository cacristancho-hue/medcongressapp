"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Logo from "@/components/ui/md-logo"

function resolveAuthMessage(rawError: string) {
  const message = rawError.toLowerCase()

  if (message.includes("email not confirmed")) {
    return "Tu correo aun no ha sido confirmado. Revisa tu bandeja de entrada."
  }

  if (message.includes("invalid login credentials")) {
    return "Correo o contrasena incorrectos."
  }

  if (message.includes("user not found")) {
    return "No encontramos una cuenta con ese correo."
  }

  return rawError
}

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get("email") ?? "")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const notice = useMemo(() => {
    if (searchParams.get("registered") === "1") {
      return "Cuenta creada. Si no te ingreso automaticamente, confirma tu correo y vuelve a iniciar sesion."
    }

    if (searchParams.get("recovery") === "1") {
      return "Tu contrasena fue actualizada. Inicia sesion con la nueva clave."
    }

    return null
  }, [searchParams])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(resolveAuthMessage(error.message))
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#f1f5f9_0%,_transparent_50%)]" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10 group cursor-default">
          <div className="transform hover:scale-105 transition-transform duration-700">
            <Logo className="h-20 w-20" />
          </div>
          <div className="mt-[-8px] relative overflow-hidden">
            <h1 className="text-2xl font-black tracking-[0.5em] text-black uppercase font-plex-mono leading-none py-1">
              CONGRESS
            </h1>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_10s_infinite] skew-x-[-20deg]" />
          </div>
          <div className="w-10 h-0.5 bg-blue-600 mt-1 rounded-full opacity-20" />
        </div>

        <Card className="border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-50 pb-8 pt-10 px-8 text-center">
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase font-plex-mono">Iniciar sesion</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-2">
              Accede a tu congreso y continua el trabajo.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5 p-8">
              {notice && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700 font-bold">
                  {notice}
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600 font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo electronico</Label>
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
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Tu contrasena"
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
                Entrar
              </Button>

              <div className="flex flex-col items-center gap-4">
                <p className="text-xs text-slate-500 font-medium">
                  {"¿Olvidaste tu contrasena?"}{" "}
                  <Link href="/recuperar" className="text-blue-600 font-black hover:underline uppercase tracking-tighter">
                    Recuperar acceso
                  </Link>
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {"¿Aun no tienes cuenta?"}{" "}
                  <Link href="/registro" className="text-blue-600 font-black hover:underline uppercase tracking-tighter">
                    Crear cuenta
                  </Link>
                </p>
                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Acceso seguro MDCONGRESS
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
