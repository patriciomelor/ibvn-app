-- =========================================================================
-- Migración MVP 13: Storage para Devocionales en formato Markdown (.md)
-- Iglesia Bautista Vida Nueva, Santiago, Chile
-- =========================================================================

-- 1. Crear el bucket 'devocionales_md' en Supabase Storage si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('devocionales_md', 'devocionales_md', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Políticas de acceso para el bucket devocionales_md

-- Permitir lectura pública de los archivos .md del devocional
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Lectura pública devocionales_md'
  ) THEN
    CREATE POLICY "Lectura pública devocionales_md" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'devocionales_md');
  END IF;
END $$;

-- Permitir a usuarios autenticados y pastores subir/actualizar devocionales .md
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Subida devocionales_md autenticados'
  ) THEN
    CREATE POLICY "Subida devocionales_md autenticados" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'devocionales_md');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Actualización devocionales_md autenticados'
  ) THEN
    CREATE POLICY "Actualización devocionales_md autenticados" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'devocionales_md');
  END IF;
END $$;
