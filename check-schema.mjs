import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('Checking columns for reference_candidates...')
  
  // Try to select the specific column that we suspect is missing
  const { error } = await supabase
    .from('reference_candidates')
    .select('master_id')
    .limit(1)
  
  if (error) {
    console.log('Column "master_id" check result: ERROR')
    console.log('Message:', error.message)
    console.log('Code:', error.code)
    console.log('Hint:', error.hint)
  } else {
    console.log('Column "master_id" check result: SUCCESS (Column EXISTS)')
  }

  // Also check for 'official_title'
  const { error: error2 } = await supabase
    .from('reference_candidates')
    .select('official_title')
    .limit(1)

  if (error2) {
    console.log('Column "official_title" check result: ERROR')
    console.log('Message:', error2.message)
  } else {
    console.log('Column "official_title" check result: SUCCESS (Column EXISTS)')
  }
}

checkSchema()
