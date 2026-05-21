import { Suspense } from "react"
import LoginClient from "./login-client"

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_24px_60px_-18px_rgba(15,23,42,0.18)]">
        <div className="h-6 w-32 rounded-full bg-slate-100" />
        <div className="mt-6 h-10 rounded-2xl bg-slate-100" />
        <div className="mt-4 h-12 rounded-2xl bg-slate-100" />
        <div className="mt-4 h-12 rounded-2xl bg-slate-100" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  )
}
