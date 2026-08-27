-- =========================================================================
-- Migración MVP 9: Bucket de Storage y Enlaces Externos en Recursos
-- Iglesia Bautista Vida Nueva, Santiago, Chile
-- =========================================================================

-- 1. AGREGAR COLUMNA EXTERNAL_URL EN LA TABLA RECURSOS
ALTER TABLE public.recursos 
  ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Hacer file_url opcional (nullable) para permitir recursos que solo contengan un enlace externo
ALTER TABLE public.recursos 
  ALTER COLUMN file_url DROP NOT NULL;

-- 2. CREAR BUCKET 'recursos' EN SUPABASE STORAGE
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recursos', 'recursos', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. POLÍTICAS DE ACCESO Y SUBIDA AL BUCKET 'recursos'
-- Permitir lectura pública de los archivos de recursos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access on recursos bucket'
  ) THEN
    CREATE POLICY "Public Access on recursos bucket" ON storage.objects
      FOR SELECT USING (bucket_id = 'recursos');
  END IF;
END $$;

-- Permitir que usuarios autenticados (pastores/administradores) suban archivos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload recursos'
  ) THEN
    CREATE POLICY "Authenticated users can upload recursos" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'recursos');
  END IF;
END $$;

-- Permitir que usuarios autenticados actualicen o eliminen archivos en el bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update recursos'
  ) THEN
    CREATE POLICY "Authenticated users can update recursos" ON storage.objects
      FOR UPDATE TO authenticated USING (bucket_id = 'recursos');
  END IF;
END $$;
