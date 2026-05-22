"use server"

import { cookies } from "next/headers"
import { isSupportedLocale, DEFAULT_LOCALE } from "@/i18n/config"

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
