// next-intl request config (cookie-based locale, no URL routing).
// Reads the LOCALE cookie set by the language switcher; defaults to Spanish
// (LATAM-first). Every existing route keeps working unchanged.

import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { DEFAULT_LOCALE, isSupportedLocale } from "./config"

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieValue = store.get("LOCALE")?.value
  const resolved = cookieValue && isSupportedLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE
  return {
    locale: resolved,
    messages: (await import(`./messages/${resolved}.json`)).default,
  }
})
