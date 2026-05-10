// i18n configuration. The app is currently Spanish-only; English/Portuguese
// scaffolding is here so we can flip the switch without re-architecting.
//
// To activate runtime locale switching:
//   1. Mount NextIntlClientProvider in app/layout.tsx
//   2. Add a <LocaleSwitcher /> in the sidebar
//   3. Wrap server components with `setRequestLocale(locale)` from
//      next-intl/server when adopting the [locale] segment pattern.

export const SUPPORTED_LOCALES = ["es", "en", "pt"] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "es"

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
}

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}
