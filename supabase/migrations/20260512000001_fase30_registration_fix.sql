-- Fase 30: Registration Fixes & Profile Sync
-- 1. Ampliar el check de roles para incluir 'student' (Estudiante de Medicina)
-- 2. Actualizar el trigger handle_new_user para persistir age, gender y workplace_type desde el inicio

-- Primero, relajamos la restricción de roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'resident', 'fellow', 'specialist', 'professor'));

-- Segundo, actualizamos la función del trigger para que sea más completa
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    role, 
    specialty, 
    age, 
    gender, 
    workplace_type
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'specialty',
    CASE 
      WHEN (new.raw_user_meta_data->>'age') IS NOT NULL AND (new.raw_user_meta_data->>'age') ~ '^[0-9]+$' 
      THEN (new.raw_user_meta_data->>'age')::integer 
      ELSE NULL 
    END,
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'workplace_type'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    specialty = EXCLUDED.specialty,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    workplace_type = EXCLUDED.workplace_type;
    
  RETURN new;
END;
$$;
