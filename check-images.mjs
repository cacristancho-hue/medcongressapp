import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkImages() {
  console.log('Checking columns for congress_images...')
  const { error } = await supabase
    .from('congress_images')
    .select('file_hash')
    .limit(1)
  
  if (error) {
    console.log('Column "file_hash" check result: ERROR')
    console.log('Message:', error.message)
  } else {
    console.log('Column "file_hash" check result: SUCCESS')
  }
}

checkImages()
