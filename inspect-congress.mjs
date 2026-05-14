import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function inspectCongress(id) {
  console.log(`--- INSPECCIONANDO CONGRESO: ${id} ---`)

  // 1. Fotos y OCR
  const { count: totalImages } = await supabase
    .from('congress_images')
    .select('*', { count: 'exact', head: true })
    .eq('congress_id', id)
    .is('deleted_at', null)

  const { count: ocrDone } = await supabase
    .from('congress_images')
    .select('*', { count: 'exact', head: true })
    .eq('congress_id', id)
    .eq('ocr_status', 'ocr_done')
    .is('deleted_at', null)

  console.log(`Fotos Totales: ${totalImages}`)
  console.log(`Fotos con OCR: ${ocrDone}`)

  // 2. Reportes
  const { data: reports } = await supabase
    .from('reports')
    .select('id, title, content, created_at')
    .eq('congress_id', id)
    .is('deleted_at', null)

  console.log(`\nReportes encontrados: ${reports?.length || 0}`)
  reports?.forEach(r => {
    console.log(`- ID: ${r.id} | Título: ${r.title} | Longitud Contenido: ${r.content?.length || 0} chars`)
  })

  // 3. Jobs en curso
  const { data: jobs } = await supabase
    .from('ai_jobs')
    .select('job_type, status, error_message, created_at')
    .eq('congress_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  console.log(`\nÚltimos Jobs en Supabase:`)
  jobs?.forEach(j => {
    console.log(`- Tipo: ${j.job_type} | Status: ${j.status} | Error: ${j.error_message || 'ninguno'}`)
  })
}

inspectCongress('36182cd1-e0a1-4eb5-813f-327bb63b3fdc')
