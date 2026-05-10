"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateFeatureFlag } from "@/lib/actions/admin"

interface Flag {
  key: string
  description: string | null
  enabled: boolean
  rollout_percentage: number
  updated_at: string
}

interface Props {
  flags: Flag[]
}

export default function FeatureFlagsTable({ flags: initialFlags }: Props) {
  const [flags, setFlags] = useState(initialFlags)
  const [pending, startTransition] = useTransition()

  function update(key: string, patch: Partial<Flag>) {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)))
  }

  function save(flag: Flag) {
    startTransition(async () => {
      const result = await updateFeatureFlag({
        key: flag.key,
        enabled: flag.enabled,
        rolloutPercentage: flag.rollout_percentage,
      })
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success(`${flag.key} actualizado`)
      }
    })
  }

  if (flags.length === 0) {
    return <p className="text-sm text-slate-500">No hay flags configurados.</p>
  }

  return (
    <ul className="divide-y divide-slate-100">
      {flags.map((flag) => (
        <li key={flag.key} className="py-3 grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto_auto] gap-3 items-center">
          <div>
            <p className="text-sm font-mono font-medium text-slate-900">{flag.key}</p>
            {flag.description && (
              <p className="text-xs text-slate-500 mt-0.5">{flag.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={flag.rollout_percentage}
              onChange={(e) => update(flag.key, { rollout_percentage: Number(e.target.value) })}
              className="w-16 rounded border border-slate-200 px-2 py-1 text-xs"
            />
            <span className="text-xs text-slate-500">%</span>
          </div>

          <label className="inline-flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={flag.enabled}
              onChange={(e) => update(flag.key, { enabled: e.target.checked })}
              className="h-3.5 w-3.5"
            />
            <span>{flag.enabled ? "Activo" : "Inactivo"}</span>
          </label>

          <button
            onClick={() => save(flag)}
            disabled={pending}
            className="rounded bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50"
          >
            Guardar
          </button>
        </li>
      ))}
    </ul>
  )
}
