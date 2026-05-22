import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"
import createNextIntlPlugin from "next-intl/plugin"

// next-intl: points at the request config that resolves the locale from cookie.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
}

// Sentry wraps the build to upload source maps and tag the release.
// Only activates if both env vars are set; otherwise the wrap is a no-op.
const sentryEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.NEXT_PUBLIC_SENTRY_DSN
)

const baseConfig = withNextIntl(nextConfig)

export default sentryEnabled
  ? withSentryConfig(baseConfig, {
      // Tag every build with the git SHA (or fallback) so Sentry groups
      // errors per release.
      release: {
        name:
          process.env.SENTRY_RELEASE ??
          process.env.VERCEL_GIT_COMMIT_SHA ??
          process.env.GITHUB_SHA ??
          "dev",
      },
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Hide source maps from browser even though they're uploaded to Sentry.
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
      silent: true,
      disableLogger: true,
      automaticVercelMonitors: false,
    })
  : baseConfig
