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
    theme_color: "#0d9488",
    lang: "es-CO",
    dir: "ltr",
    categories: ["medical", "education", "productivity"],
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
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
