"use server"

import { cookies } from "next/headers"
import { isSupportedLocale, DEFAULT_LOCALE } from "@/i18n/config"

// Resolve the active UI locale (LOCALE cookie) for server actions that pass it
// to the AI router so inferred output (summaries, topics, reports) matches the
// language the user is reading. Falls back to the default locale.
export async function getActiveLocale(): Promise<"es" | "en"> {
  const store = await cookies()
  const value = store.get("LOCALE")?.value
  return value && isSupportedLocale(value) ? (value as "es" | "en") : (DEFAULT_LOCALE as "es" | "en")
}

// Persist the chosen UI language in the LOCALE cookie (read by i18n/request.ts).
export async function setLocale(locale: string) {
  const store = await cookies()
  const value = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE
  store.set("LOCALE", value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  })
}
