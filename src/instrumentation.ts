// Next.js 16 instrumentation hook.
// Boots Sentry for both Node and Edge runtimes when SENTRY_DSN is set.
// Falls back to a no-op when DSN is missing so local dev never breaks.

export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs")
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
      enabled: process.env.NODE_ENV === "production",
    })
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs")
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
      enabled: process.env.NODE_ENV === "production",
    })
  }
}

// Re-export Sentry's request error capturer behind an env-flag guard.
// In dev (no DSN) we skip; in prod we forward.
import type { Instrumentation } from "next"

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  const Sentry = await import("@sentry/nextjs")
  Sentry.captureRequestError(err, request, context)
}
