"use client"

import { MEDICAL_SPECIALTIES_RETHUS } from "@/lib/constants/medical-specialties"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export default function CongressForm() {
  const router = useRouter()
  const t = useTranslations("congressForm")
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    start_date: "",
    end_date: "",
    specialty: "",
    notes: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError(t("errorSession"))
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from("congresses")
      .insert({
        user_id: user.id,
        name: formData.name,
        location: formData.location || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        specialty: formData.specialty || null,
        notes: formData.notes || null,
      })
      .select()
      .single()

    if (insertError) {
      setError(t("errorCreate"))
      setLoading(false)
      return
    }

    router.push(`/dashboard/congresos/${data.id}`)
    router.refresh()
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              name="name"
              placeholder={t("namePlaceholder")}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="specialty">{t("specialtyLabel")}</Label>
            <select
              id="specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            >
              <option value="">{t("specialtyPlaceholder")}</option>
              {MEDICAL_SPECIALTIES_RETHUS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Otra">{t("otherSpecialty")}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">{t("locationLabel")}</Label>
            <Input
              id="location"
              name="location"
              placeholder={t("locationPlaceholder")}
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">{t("startDateLabel")}</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">{t("endDateLabel")}</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("notesLabel")}</Label>
            <textarea
              id="notes"
              name="notes"
              placeholder={t("notesPlaceholder")}
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 resize-none"
            />
          </div>
        </CardContent>
        <CardFooter className="gap-3">
          <Button type="submit" loading={loading}>
            {t("submit")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            {t("cancel")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
