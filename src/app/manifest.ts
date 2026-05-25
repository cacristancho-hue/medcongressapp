import { type MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MDCONGRESS - Inteligencia Académica",
    short_name: "MDCONGRESS",
    description: "Multi-Model AI for Clinical Evidence and Medical Congresses",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      // PNG 192/512 are required for installability (Android/Chrome) and stores.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    orientation: "portrait",
    shortcuts: [
      {
        name: "Mi Biblioteca",
        url: "/dashboard/biblioteca",
        icons: [{ src: "/favicon.svg", sizes: "any" }],
      },
      {
        name: "Nuevo Congreso",
        url: "/dashboard/congresos/nuevo",
        icons: [{ src: "/favicon.svg", sizes: "any" }],
      },
    ],
  }
}
