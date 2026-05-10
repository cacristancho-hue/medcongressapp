"use client"

import OnboardingTour from "./onboarding-tour"

/**
 * The 3-step tour shown to returning users on first visit to the dashboard.
 * Each step references a `data-tour` attribute on the live page.
 * If the user already completed it, the localStorage check inside
 * OnboardingTour suppresses re-showing.
 */
export default function DashboardTour() {
  return (
    <OnboardingTour
      steps={[
        {
          target: '[data-tour="dashboard-stats"]',
          title: "Tu actividad de un vistazo",
          description:
            "Aquí ves tus congresos, fotos subidas, reportes generados y referencias verificadas. Se actualizan en tiempo real.",
          placement: "bottom",
        },
        {
          target: '[data-tour="dashboard-recent"]',
          title: "Tus congresos recientes",
          description:
            "Haz clic para abrir cualquiera y subir más fotos, generar el reporte académico o descargar el paquete.",
          placement: "top",
        },
        {
          target: '[data-tour="sidebar-biblioteca"]',
          title: "Biblioteca centralizada",
          description:
            "Todas tus referencias bibliográficas verificadas (CrossRef + PubMed + OpenAlex) en un solo lugar.",
          placement: "right",
        },
      ]}
    />
  )
}
