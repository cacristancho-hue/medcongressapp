import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import ServiceWorkerRegister from "@/components/layout/service-worker-register"

export const metadata: Metadata = {
  title: "MedCongress – Companion académico post-congreso",
  description:
    "Convierte tus fotos de congresos médicos en conocimiento académico organizado, verificable y exportable.",
  applicationName: "MedCongress",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MedCongress",
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
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
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" richColors closeButton />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
