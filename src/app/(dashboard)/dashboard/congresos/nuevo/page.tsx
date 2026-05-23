import CongressForm from "@/components/congresses/congress-form"
import { getTranslations } from "next-intl/server"

export default async function NuevoCongresoPage() {
  const t = await getTranslations("congressForm")
  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{t("pageTitle")}</h2>
        <p className="text-slate-500 text-sm mt-1">
          {t("pageSubtitle")}
        </p>
      </div>
      <CongressForm />
    </div>
  )
}
