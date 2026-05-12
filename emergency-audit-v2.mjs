import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jpossylbyldxgzegyrkw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwb3NzeWxieWxkeGd6ZWd5cmt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyODU1OCwiZXhwIjoyMDkzNDA0NTU4fQ.DjgKntCmX3RNV0-HXeatBqo8F4wnnX637_4q1Eg2nKo'

const supabase = createClient(supabaseUrl, supabaseKey)

async function audit() {
  const userId = 'dbde0af0-c777-4a94-b335-c6438fe6058d'
  
  console.log('--- AUDITORÍA DE EMERGENCIA ---')

  const { count: activeImages } = await supabase
    .from('congress_images')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
  
  console.log('Active Images in whole DB:', activeImages)

  const { data: userImages } = await supabase
    .from('congress_images')
    .select('id, congress_id, deleted_at')
    .eq('user_id', userId)

  console.log(`Images for User: ${userImages?.length ?? 0}`)
  console.log(`Deleted Images for User: ${userImages?.filter(i => i.deleted_at !== null).length ?? 0}`)
  console.log(`Active Images for User: ${userImages?.filter(i => i.deleted_at === null).length ?? 0}`)

  const { data: refs } = await supabase
    .from('reference_candidates')
    .select('id, image_id, congresses(name, deleted_at), congress_images(deleted_at)')
    .eq('user_id', userId)

  console.log(`Total Refs in DB for User: ${refs?.length ?? 0}`)

  const passFilter = refs?.filter(r => {
    const congressActive = r.congresses && r.congresses.deleted_at === null
    const imageActive = r.image_id && r.congress_images && r.congress_images.deleted_at === null
    return congressActive && imageActive
  })

  console.log(`Refs passing strict filter: ${passFilter?.length ?? 0}`)
  if (passFilter && passFilter.length > 0) {
    console.log('Congress distribution of visible refs:')
    const dist = {}
    passFilter.forEach(r => {
        const name = r.congresses.name
        dist[name] = (dist[name] || 0) + 1
    })
    console.log(dist)
  }
}

audit()
