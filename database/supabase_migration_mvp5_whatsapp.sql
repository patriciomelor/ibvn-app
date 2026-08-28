-- =========================================================================
-- Migración MVP 5: WhatsApp Opt-in y Storage de Avatares
-- Iglesia Bautista Vida Nueva, Santiago, Chile
-- =========================================================================

-- 1. COLUMNAS DE WHATSAPP OPT-IN EN PROFILES
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS whatsapp_optin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_optin_date TIMESTAMPTZ;

-- 2. STORAGE: BUCKET DE AVATARES
-- Asegurar que el bucket 'avatars' existe y es público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. POLÍTICAS DE STORAGE PARA AVATARES
-- Permitir que usuarios autenticados suban avatares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload avatars'
  ) THEN
    CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
  END IF;
END $$;

-- Permitir que usuarios autenticados actualicen sus avatares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update avatars'
  ) THEN
    CREATE POLICY "Authenticated users can update avatars" ON storage.objects
      FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Permitir lectura pública de avatares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read avatars'
  ) THEN
    CREATE POLICY "Anyone can read avatars" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
END $$;
