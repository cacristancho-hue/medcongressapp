import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRpc() {
  console.log('Testing exec_sql RPC...')
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' })
  
  if (error) {
    console.error('RPC failed:', error.message)
    console.log('Hint: The exec_sql RPC is probably not installed on this Supabase project.')
  } else {
    console.log('RPC success! Result:', data)
  }
}

testRpc()
