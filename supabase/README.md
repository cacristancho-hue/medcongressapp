# Supabase SQL Order

Execute the migrations manually in the Supabase SQL Editor in this order:

1. `schema.sql`
2. `schema_fase2.sql`
3. `schema_fase3.sql`
4. `schema_fase4.sql`
5. `schema_fase5.sql`
6. `schema_fase6_images.sql`
7. `schema_fase7_reference_candidates.sql`
8. `schema_fase8_fixes.sql` (BUG-1 report_type CHECK + RIESGO-2 reports UPDATE policy)
9. `schema_fase9_deprecate_references.sql` (marca `public.references` como DEPRECATED)
10. `schema_fase10_retracted_status.sql` (añade `'retracted'` al CHECK + columnas verification_source/notes)

`public.references` is deprecated. The active flow uses `public.reference_candidates`. App code reads/writes only the candidate table since fase 9. Reference verification queries CrossRef + PubMed + OpenAlex and detects retractions via CrossRef `update-to`, PubMed `pubtype`, and OpenAlex `is_retracted`.
