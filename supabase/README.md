# Supabase SQL Order

Execute the migrations manually in the Supabase SQL Editor in this order:

1. `schema.sql`
2. `schema_fase2.sql`
3. `schema_fase3.sql`
4. `schema_fase4.sql`
5. `schema_fase5.sql`
6. `schema_fase6_images.sql`
7. `schema_fase7_reference_candidates.sql`

`public.references` remains available as a legacy/deprecated table for now. The active candidate-reference flow uses `public.reference_candidates`.
