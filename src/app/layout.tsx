import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import ServiceWorkerRegister from "@/components/layout/service-worker-register"
import LegalFooter from "@/components/layout/legal-footer"
import { fontInter, fontPlexMono } from "@/lib/fonts"

export const metadata: Metadata = {
  title: {
    default: "MDCONGRESS - Elite Academic Companion",
    template: "%s · MDCONGRESS",
  },
  description:
    "Multi-Model AI for Clinical Evidence and Medical Congresses. Evidence at the speed of sight.",
  applicationName: "MDCONGRESS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MDCONGRESS",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <main className="flex-1">
          {children}
        </main>
        <LegalFooter />
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
