import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jpossylbyldxgzegyrkw.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('Testing library query...')
  const { data, error } = await supabase
    .from('reference_candidates')
    .select('id, official_title, is_open_access, congresses(name)')
    .limit(1)

  if (error) {
    console.error('Query failed:', error.message)
    console.error('Hint:', error.hint)
    console.error('Details:', error.details)
  } else {
    console.log('Query success! Data:', data)
  }
}

test()
