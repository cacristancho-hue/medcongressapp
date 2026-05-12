-- Fase 29: Profile Expansion (Age, Gender, Workplace)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS workplace_type text; -- 'public', 'private', 'both'

-- Comments for clarity
COMMENT ON COLUMN public.profiles.workplace_type IS 'Tipo de lugar de trabajo: public, private o both';
