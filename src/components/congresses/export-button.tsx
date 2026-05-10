"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Download, ExternalLink } from "lucide-react"
import { exportCongress } from "@/lib/actions/export"

interface Props {
  congressId: string
}

interface ExportResultData {
  signedUrl: string
  filename: string
  sizeBytes: number
  imagesIncluded: number
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export default function ExportButton({ congressId }: Props) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ExportResultData | null>(null)

  function handleExport() {
    setResult(null)
    startTransition(async () => {
      const res = await exportCongress({ congressId })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setResult({
        signedUrl: res.signedUrl,
        filename: res.filename,
        sizeBytes: res.sizeBytes,
        imagesIncluded: res.imagesIncluded,
      })
      toast.success("Paquete listo")
    })
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleExport}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando ZIP…
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Generar paquete
          </>
        )}
      </button>

      {result && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 space-y-1 text-xs">
          <p className="font-semibold text-emerald-900">{result.filename}</p>
          <p className="text-slate-600">
            {fmtBytes(result.sizeBytes)} · {result.imagesIncluded} foto{result.imagesIncluded === 1 ? "" : "s"}
          </p>
          <a
            href={result.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-800 font-medium hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Descargar (válido 1 hora)
          </a>
        </div>
      )}
    </div>
  )
}
