// next-intl request config. Currently always returns Spanish messages.
// When we activate locale switching, this is where we read the cookie/header
// and load the matching dictionary.

import { getRequestConfig } from "next-intl/server"
import { DEFAULT_LOCALE, isSupportedLocale } from "./config"

export default getRequestConfig(async ({ locale }) => {
  const resolved = locale && isSupportedLocale(locale) ? locale : DEFAULT_LOCALE
  return {
    locale: resolved,
    messages: (await import(`./messages/${resolved}.json`)).default,
  }
})
