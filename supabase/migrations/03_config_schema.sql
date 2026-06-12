-- MIGRACIÓN 03: CONFIGURACIÓN GLOBAL DE IGLESIA Y MINISTERIOS

-- 1. TABLA CHURCH SETTINGS (Configuración Global)
CREATE TABLE IF NOT EXISTS public.church_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Singleton, solo puede haber una fila con id=1
    name TEXT NOT NULL DEFAULT 'Vida Nueva App',
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    social_facebook TEXT,
    social_instagram TEXT,
    social_youtube TEXT,
    mayordomo_name TEXT,
    calendar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar valores por defecto iniciales
INSERT INTO public.church_settings (id, name, address) 
VALUES (1, 'Vida Nueva', 'Santiago, Chile') 
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de church settings" ON public.church_settings;
DROP POLICY IF EXISTS "Admin puede actualizar church settings" ON public.church_settings;

CREATE POLICY "Lectura publica de church settings" ON public.church_settings FOR SELECT USING (true);
CREATE POLICY "Admin puede actualizar church settings" ON public.church_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
);
CREATE POLICY "Admin puede insertar church settings" ON public.church_settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
);


-- 2. TABLA MINISTERIOS (Añadir Lider y Gestión si no existe)
-- Nos aseguramos que la tabla exista (probablemente se creó manualmente antes, pero es mejor prevenir)
CREATE TABLE IF NOT EXISTS public.ministerios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT
);

-- Agregar lider_id si no existe
ALTER TABLE public.ministerios ADD COLUMN IF NOT EXISTS lider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.ministerios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de ministerios" ON public.ministerios;
DROP POLICY IF EXISTS "Admin puede gestionar ministerios" ON public.ministerios;

CREATE POLICY "Lectura publica de ministerios" ON public.ministerios FOR SELECT USING (true);
CREATE POLICY "Admin puede gestionar ministerios" ON public.ministerios FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
);


-- 3. BUCKET DE STORAGE: SETTINGS (Para Logos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('settings', 'settings', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Acceso publico imagenes settings" ON storage.objects;
DROP POLICY IF EXISTS "Admin puede subir imagenes settings" ON storage.objects;
DROP POLICY IF EXISTS "Admin puede actualizar imagenes settings" ON storage.objects;
DROP POLICY IF EXISTS "Admin puede eliminar imagenes settings" ON storage.objects;

CREATE POLICY "Acceso publico imagenes settings" ON storage.objects FOR SELECT USING ( bucket_id = 'settings' );
CREATE POLICY "Admin puede subir imagenes settings" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'settings' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
);
CREATE POLICY "Admin puede actualizar imagenes settings" ON storage.objects FOR UPDATE USING (
  bucket_id = 'settings' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
);
CREATE POLICY "Admin puede eliminar imagenes settings" ON storage.objects FOR DELETE USING (
  bucket_id = 'settings' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
);
