// Premium typography loaded via next/font.
// Inter for UI / body / headings — the de-facto SaaS premium font (Linear,
// Notion, Vercel, Shopify all use it).
// IBM Plex Mono for technical data (DOIs, PMIDs, UUIDs, code blocks) —
// trustworthy "engineered + human" feel suited for medical/regulated.

import { Inter, IBM_Plex_Mono } from "next/font/google"

export const fontInter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
  // Inter v4 stylistic sets enabled at the OpenType layer in globals.css.
})

export const fontPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
})
