// Browser-side Sentry init. Loaded by Next.js when present.
// No-op if SENTRY_DSN env var is missing.

import * as Sentry from "@sentry/nextjs"

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    enabled: process.env.NODE_ENV === "production",
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
