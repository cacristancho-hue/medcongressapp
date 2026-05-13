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

async function deepAudit() {
  console.log('--- AUDITORÍA DE REGISTRO CRÍTICO ---')
  const now = new Date()
  console.log('Hora actual:', now.toISOString())

  // 1. Listar últimos 10 usuarios de Auth para ver si hay intentos fallidos que crearon cuenta pero no perfil
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('Error Auth:', authError.message)
  } else {
    console.log('\nÚltimos 10 usuarios en Auth:')
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
         .slice(0, 10)
         .forEach(u => {
           console.log(`- ID: ${u.id} | Email: ${u.email} | Creado: ${u.created_at} | Confirmado: ${!!u.email_confirmed_at}`)
         })
  }

  // 2. Verificar perfiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (profileError) {
    console.error('Error Perfiles:', profileError.message)
  } else {
    console.log('\nÚltimos 10 perfiles en tabla pública:')
    profiles.forEach(p => {
      console.log(`- UserID: ${p.user_id} | Nombre: ${p.full_name} | Rol: ${p.role} | Creado: ${p.created_at}`)
    })
  }

  // 3. Verificar si hay usuarios en Auth SIN perfil (esto indicaría que el trigger falló)
  const authIds = new Set(users.map(u => u.id))
  const profileIds = new Set(profiles.map(p => p.user_id))
  
  const orphaned = users.filter(u => !profileIds.has(u.id)).slice(0, 5)
  if (orphaned.length > 0) {
    console.log('\n⚠️ USUARIOS HUÉRFANOS DETECTADOS (Auth existe, Perfil NO):')
    orphaned.forEach(u => console.log(`- ${u.email} (${u.id})`))
  } else {
    console.log('\n✅ No se detectaron usuarios huérfanos recientes.')
  }
}

deepAudit()
