import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import ServiceWorkerRegister from "@/components/layout/service-worker-register"
import { fontInter, fontPlexMono } from "@/lib/fonts"

export const metadata: Metadata = {
  title: {
    default: "MedCongress — Companion académico para médicos",
    template: "%s · MedCongress",
  },
  description:
    "Convierte tus fotos de congresos médicos en conocimiento académico organizado, verificable y exportable.",
  applicationName: "MedCongress",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MedCongress",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d9488" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${fontInter.variable} ${fontPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "font-sans",
            },
          }}
        />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
