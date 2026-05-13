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

async function checkQuota() {
  const email = 'cac-94@hotmail.com'
  console.log(`--- AUDITORÍA DE CUOTA PARA: ${email} ---`)

  const { data: user, error: userError } = await supabase.auth.admin.listUsers()
  const targetUser = user?.users.find(u => u.email === email)

  if (!targetUser) {
    console.error('Usuario no encontrado')
    return
  }

  const { data: limits, error: limitsError } = await supabase
    .from('ai_usage_limits')
    .select('*')
    .eq('user_id', targetUser.id)
    .maybeSingle()

  if (limitsError) {
    console.error('Error leyendo límites:', limitsError.message)
  } else {
    console.log('Límites actuales:', limits || 'SIN LÍMITES CONFIGURADOS (Usa defaults: 15 img / $1.50)')
  }

  const { data: usage, error: usageError } = await supabase
    .from('ai_usage')
    .select('action_type, estimated_cost_usd, status, created_at')
    .eq('user_id', targetUser.id)
    .eq('status', 'success')
    .gte('created_at', new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1).toISOString())

  if (usageError) {
    console.error('Error leyendo uso:', usageError.message)
  } else {
    const usedImages = usage.filter(r => r.action_type === 'image_analysis').length
    const totalCost = usage.reduce((sum, r) => sum + Number(r.estimated_cost_usd || 0), 0)
    
    console.log(`\nResumen de uso (Mes actual):`)
    console.log(`- Imágenes procesadas: ${usedImages}`)
    console.log(`- Costo total estimado: $${totalCost.toFixed(2)} USD`)
  }
}

checkQuota()
