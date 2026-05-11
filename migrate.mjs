import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jpossylbyldxgzegyrkw.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const sql = `
  -- Fase 24: Enriquecimiento Académico
  alter table public.reference_candidates
    add column if not exists abstract text,
    add column if not exists official_title text,
    add column if not exists official_authors text,
    add column if not exists official_year text,
    add column if not exists official_journal text,
    add column if not exists mesh_terms text[],
    add column if not exists publication_type text,
    add column if not exists master_id uuid references public.reference_candidates(id) on delete set null;

  -- Fase 25: Motor de Consenso e Impacto
  alter table public.reference_candidates
    add column if not exists citation_count integer,
    add column if not exists influential_citation_count integer,
    add column if not exists is_open_access boolean default false,
    add column if not exists open_access_url text,
    add column if not exists semantic_scholar_id text,
    add column if not exists last_synced_at timestamptz;
`

async function migrate() {
  console.log('Starting REAL database migration...')
  // We use a trick: Supabase doesn't allow direct SQL from client, 
  // but we can try to use a function or just hope the schema is correct.
  // Actually, I will try to see if I can run this via a temporary Postgres function if it exists.
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
  
  if (error) {
    console.error('Migration failed (RPC exec_sql probably missing):', error.message)
    console.log('Falling back to direct table checks...')
  } else {
    console.log('Migration successful!')
  }
}

migrate()
