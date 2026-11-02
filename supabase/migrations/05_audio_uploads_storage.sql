-- 05. BUCKET DE STORAGE: AUDIO_UPLOADS (Audios de predicas para generar devocionales con IA)
-- Bucket privado: solo pastor_admin puede subir/leer/borrar desde el cliente.
-- La API /api/process-audio descarga con la Service Role Key (bypassa RLS).

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio_uploads', 'audio_uploads', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admin puede leer audios" ON storage.objects;
DROP POLICY IF EXISTS "Admin puede subir audios" ON storage.objects;
DROP POLICY IF EXISTS "Admin puede actualizar audios" ON storage.objects;
DROP POLICY IF EXISTS "Admin puede eliminar audios" ON storage.objects;

CREATE POLICY "Admin puede leer audios" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'audio_uploads'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND rol = 'pastor_admin')
);

CREATE POLICY "Admin puede subir audios" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'audio_uploads'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND rol = 'pastor_admin')
);

CREATE POLICY "Admin puede actualizar audios" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'audio_uploads'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND rol = 'pastor_admin')
)
WITH CHECK (
  bucket_id = 'audio_uploads'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND rol = 'pastor_admin')
);

CREATE POLICY "Admin puede eliminar audios" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'audio_uploads'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND rol = 'pastor_admin')
);
