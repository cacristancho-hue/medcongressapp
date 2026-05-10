"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Trash2, Power } from "lucide-react"
import {
  createWebhookEndpoint,
  toggleWebhookEndpoint,
  deleteWebhookEndpoint,
} from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Endpoint {
  id: string
  url: string
  description: string | null
  events: string[]
  enabled: boolean
  created_at: string
}

interface Props {
  endpoints: Endpoint[]
}

const AVAILABLE_EVENTS = [
  "congress.created",
  "congress.deleted",
  "image.uploaded",
  "image.analyzed",
  "report.generated",
  "references.verified",
  "billing.upgraded",
]

export default function WebhooksTable({ endpoints: initial }: Props) {
  const [endpoints, setEndpoints] = useState(initial)
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [pending, startTransition] = useTransition()
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)

  function toggleEvent(ev: string) {
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    )
  }

  function handleCreate() {
    startTransition(async () => {
      const result = await createWebhookEndpoint({
        url,
        description: description.trim() || undefined,
        events: selectedEvents,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Endpoint creado. Copia el secret ahora — no se volverá a mostrar.")
      setRevealedSecret(result.secret)
      setUrl("")
      setDescription("")
      setSelectedEvents([])
      // Optimistic add (temporary id; user can refresh to re-fetch).
      setEndpoints((prev) => [
        {
          id: result.id,
          url,
          description: description || null,
          events: selectedEvents,
          enabled: true,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleWebhookEndpoint({ id, enabled: !current })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setEndpoints((prev) => prev.map((e) => (e.id === id ? { ...e, enabled: !current } : e)))
    })
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este endpoint?")) return
    startTransition(async () => {
      const result = await deleteWebhookEndpoint(id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setEndpoints((prev) => prev.filter((e) => e.id !== id))
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Crear nuevo endpoint</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <input
            type="url"
            placeholder="https://tu-servicio.com/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_EVENTS.map((ev) => (
              <label
                key={ev}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs cursor-pointer transition-colors ${
                  selectedEvents.includes(ev)
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(ev)}
                  onChange={() => toggleEvent(ev)}
                  className="hidden"
                />
                {ev}
              </label>
            ))}
          </div>
          <button
            onClick={handleCreate}
            disabled={pending || !url || selectedEvents.length === 0}
            className="rounded bg-slate-900 text-white text-sm font-medium px-4 py-1.5 hover:bg-slate-800 disabled:opacity-50"
          >
            Crear endpoint
          </button>

          {revealedSecret && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs">
              <p className="font-semibold text-amber-900 mb-1">
                Secret del nuevo endpoint (cópialo ahora):
              </p>
              <code className="block font-mono break-all text-slate-900">
                {revealedSecret}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Endpoints registrados ({endpoints.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {endpoints.length === 0 ? (
            <p className="text-xs text-slate-500">No hay endpoints todavía.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {endpoints.map((ep) => (
                <li key={ep.id} className="py-3 flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-900 truncate">{ep.url}</p>
                    {ep.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{ep.description}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {ep.events.join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggle(ep.id, ep.enabled)}
                      title={ep.enabled ? "Pausar" : "Activar"}
                      className={`rounded p-1.5 ${
                        ep.enabled
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ep.id)}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
