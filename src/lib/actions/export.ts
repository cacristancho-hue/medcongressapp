"use server"

import JSZip from "jszip"
import { withAction } from "@/lib/with-action"
import { dispatchWebhook } from "@/lib/webhooks"

interface ExportInput {
  congressId: string
}

interface ExportResult {
  signedUrl: string
  filename: string
  sizeBytes: number
  imagesIncluded: number
  expiresInSeconds: number
}

/**
 * Build a ZIP with everything we know about a congress and stash it in
 * Storage. Returns a signed URL the client can use to download it.
 *
 * Layout inside the ZIP:
 *   <congress-name>/
 *     manifest.json
 *     report.md                 (latest report, if any)
 *     images/<filename>.jpg     (all optimized photos)
 *     ocr/<filename>.txt        (OCR cleaned text per photo)
 *     references.json           (every reference candidate + status)
 *     topics.json               (topics with image_indices)
 */
export const exportCongress = withAction({
  name: "congress.update",
  rateLimit: "report_generation",
})<ExportInput, ExportResult>(async ({ user, supabase }, input) => {
  const { congressId } = input

  // 1. Ownership + load congress
  const { data: congress } = await supabase
    .from("congresses")
    .select("id, name, specialty, location, start_date, end_date, notes")
    .eq("id", congressId)
    .eq("user_id", user.id)
    .single()
  if (!congress) throw new Error("Congreso no encontrado")

  // 2. Load related data in parallel
  const [imagesRes, ocrRes, refsRes, topicsRes, reportsRes] = await Promise.all([
    supabase
      .from("congress_images")
      .select("id, original_filename, storage_path_optimized, storage_path, created_at")
      .eq("congress_id", congressId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("ocr_results")
      .select("image_id, cleaned_text, raw_text"),
    supabase
      .from("reference_candidates")
      .select(
        "id, image_id, raw_reference_text, detected_title, detected_authors, detected_year, detected_journal, detected_doi, detected_pmid, verification_status, confidence_score"
      )
      .eq("congress_id", congressId),
    supabase
      .from("topics")
      .select("id, name, category, description, image_topics(image_id)")
      .eq("congress_id", congressId),
    supabase
      .from("reports")
      .select("id, title, content, report_type, created_at")
      .eq("congress_id", congressId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1),
  ])

  type Img = { id: string; original_filename: string; storage_path_optimized: string | null; storage_path: string }
  const images = (imagesRes.data ?? []) as Img[]
  type Ocr = { image_id: string; cleaned_text: string | null; raw_text: string | null }
  const ocrByImage = new Map<string, Ocr>()
  for (const o of (ocrRes.data ?? []) as Ocr[]) ocrByImage.set(o.image_id, o)

  // 3. Build the ZIP
  const zip = new JSZip()
  const safeName = congress.name.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 80) || "congress"
  const root = zip.folder(safeName)
  if (!root) throw new Error("No se pudo crear ZIP root")

  // Manifest
  root.file(
    "manifest.json",
    JSON.stringify(
      {
        version: 1,
        exported_at: new Date().toISOString(),
        exported_by: user.email,
        congress,
        counts: {
          images: images.length,
          references: refsRes.data?.length ?? 0,
          topics: topicsRes.data?.length ?? 0,
          reports: reportsRes.data?.length ?? 0,
        },
      },
      null,
      2
    )
  )

  // Report
  if (reportsRes.data && reportsRes.data.length > 0) {
    root.file("report.md", reportsRes.data[0].content ?? "")
  }

  // References
  root.file("references.json", JSON.stringify(refsRes.data ?? [], null, 2))
  root.file("topics.json", JSON.stringify(topicsRes.data ?? [], null, 2))

  // Images + OCR per image
  const imagesFolder = root.folder("images")
  const ocrFolder = root.folder("ocr")
  if (!imagesFolder || !ocrFolder) throw new Error("ZIP folders failed")

  let downloadedCount = 0
  for (const img of images) {
    const path = img.storage_path_optimized ?? img.storage_path
    const filename = sanitizeFilename(img.original_filename, img.id)
    const { data: signedData } = await supabase.storage
      .from("congress-photos")
      .createSignedUrl(path, 300)
    if (signedData?.signedUrl) {
      try {
        const resp = await fetch(signedData.signedUrl)
        if (resp.ok) {
          const buf = Buffer.from(await resp.arrayBuffer())
          imagesFolder.file(filename, buf)
          downloadedCount++
        }
      } catch (err) {
        console.warn(`[export] failed to fetch image ${img.id}:`, err)
      }
    }
    const ocr = ocrByImage.get(img.id)
    if (ocr?.cleaned_text) {
      ocrFolder.file(filename.replace(/\.[^.]+$/, ".txt"), ocr.cleaned_text)
    }
  }

  // 4. Generate ZIP and upload
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const exportPath = `${user.id}/${congressId}/${timestamp}.zip`
  const { error: uploadErr } = await supabase.storage
    .from("congress-exports")
    .upload(exportPath, zipBuffer, {
      contentType: "application/zip",
      upsert: false,
    })
  if (uploadErr) throw new Error(`Upload del ZIP falló: ${uploadErr.message}`)

  const { data: signedExport } = await supabase.storage
    .from("congress-exports")
    .createSignedUrl(exportPath, 60 * 60) // 1 hour
  if (!signedExport?.signedUrl) throw new Error("Signed URL falló")

  // 5. Fire-and-forget webhook
  dispatchWebhook({
    event: "report.generated",
    payload: {
      kind: "export",
      congress_id: congressId,
      filename: `${safeName}.zip`,
      size_bytes: zipBuffer.length,
      images_included: downloadedCount,
    },
    userId: user.id,
  }).catch(() => {})

  return {
    signedUrl: signedExport.signedUrl,
    filename: `${safeName}.zip`,
    sizeBytes: zipBuffer.length,
    imagesIncluded: downloadedCount,
    expiresInSeconds: 3600,
  }
})

function sanitizeFilename(name: string, fallback: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._\-]/g, "_").slice(0, 100)
  return cleaned || `${fallback}.bin`
}
