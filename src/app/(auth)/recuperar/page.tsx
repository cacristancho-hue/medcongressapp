"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Logo from "@/components/ui/md-logo"
import { ShieldCheck } from "lucide-react"

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/recuperar/nueva`
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage("Si el correo existe, enviamos un enlace para crear una nueva contrasena.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el correo de recuperacion.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#f1f5f9_0%,_transparent_50%)]"></div>

      <div className="w-full max-w-md relative z-10">
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
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase font-plex-mono">Recuperar acceso</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-2">
              Te enviaremos un enlace para crear una nueva contrasena.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 p-8">
              {message && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700 font-bold">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600 font-bold">
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
            </CardContent>

            <CardContent className="flex flex-col gap-4 p-8 pt-0">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-slate-900 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95"
                loading={loading}
              >
                Enviar enlace
              </Button>

              <div className="flex items-center justify-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Acceso seguro MDCONGRESS
              </div>
              <Link href="/login" className="text-center text-xs font-bold text-blue-600 hover:underline uppercase tracking-tighter">
                Volver al inicio de sesion
              </Link>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
