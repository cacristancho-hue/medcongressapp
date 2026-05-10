import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MedCongress",
    short_name: "MedCongress",
    description:
      "Convierte cada congreso médico en conocimiento académico organizado, verificable y exportable.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    lang: "es-CO",
    dir: "ltr",
    categories: ["medical", "education", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Mis congresos",
        short_name: "Congresos",
        url: "/dashboard/congresos",
        description: "Ver tus congresos guardados",
      },
      {
        name: "Biblioteca",
        short_name: "Biblioteca",
        url: "/dashboard/biblioteca",
        description: "Tu bibliografía consolidada",
      },
    ],
  }
}
