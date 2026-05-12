import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'app/.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function audit() {
  const userId = 'dbde0af0-c777-4a94-b335-c6438fe6058d'
  
  const { count: activeImages } = await supabase
    .from('congress_images')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
  
  console.log('Active Images in DB:', activeImages)

  const { data: refs } = await supabase
    .from('reference_candidates')
    .select('id, image_id, congresses(deleted_at), congress_images(deleted_at)')
    .eq('user_id', userId)

  console.log('Total Refs in DB:', refs?.length ?? 0)

  const activeRefs = refs?.filter(r => {
    const congressActive = r.congresses && r.congresses.deleted_at === null
    const imageActive = r.image_id && r.congress_images && r.congress_images.deleted_at === null
    return congressActive && imageActive
  })

  console.log('Refs that pass the NEW STRICT filter:', activeRefs?.length ?? 0)
  
  if (activeRefs && activeRefs.length > 0) {
    console.log('Sample of an "active" ref congress:', activeRefs[0].congress_id)
  }
}

audit()
