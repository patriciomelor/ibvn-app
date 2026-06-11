-- SCRIPT MAESTRO DE MIGRACIÓN: REFUERZO ARQUITECTÓNICO (RLS, AVATARES Y JOURNALING)
-- Instrucciones: Copia y pega este script en el SQL Editor de tu Dashboard de Supabase y presiona "Run".

-- 1. TABLA PROFILES: Añadir campo avatar_url y RLS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas previas por si acaso para no crear duplicados
DROP POLICY IF EXISTS "Lectura pública de perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Actualizar propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admin puede actualizar perfiles" ON public.profiles;

CREATE POLICY "Lectura pública de perfiles" ON public.profiles 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Actualizar propio perfil" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin puede actualizar perfiles" ON public.profiles 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
  );


-- 2. TABLA DEVOCIONALES: RLS
ALTER TABLE public.devocionales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública devocionales" ON public.devocionales;
DROP POLICY IF EXISTS "Admin puede insertar devocionales" ON public.devocionales;
DROP POLICY IF EXISTS "Admin puede actualizar devocionales" ON public.devocionales;

CREATE POLICY "Lectura pública devocionales" ON public.devocionales 
  FOR SELECT USING (true);

CREATE POLICY "Admin puede insertar devocionales" ON public.devocionales 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
  );

CREATE POLICY "Admin puede actualizar devocionales" ON public.devocionales 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
  );


-- 3. TABLA DEVOTIONAL JOURNAL (Diario Personal MVP 1)
CREATE TABLE IF NOT EXISTS public.devotional_journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    devocional_id UUID REFERENCES public.devocionales(id) ON DELETE CASCADE NOT NULL,
    apreciacion TEXT,
    cambios TEXT,
    oracion_personal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, devocional_id) -- Un único diario por devocional
);

ALTER TABLE public.devotional_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver propio journal" ON public.devotional_journal;
DROP POLICY IF EXISTS "Insertar propio journal" ON public.devotional_journal;
DROP POLICY IF EXISTS "Actualizar propio journal" ON public.devotional_journal;

CREATE POLICY "Ver propio journal" ON public.devotional_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insertar propio journal" ON public.devotional_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Actualizar propio journal" ON public.devotional_journal FOR UPDATE USING (auth.uid() = user_id);


-- 4. TABLA PASTORAL NOTES (Estrictamente Confidencial)
CREATE TABLE IF NOT EXISTS public.pastoral_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pastoral_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin puede ver notas pastorales" ON public.pastoral_notes;
DROP POLICY IF EXISTS "Admin puede escribir notas pastorales" ON public.pastoral_notes;

CREATE POLICY "Admin puede ver notas pastorales" ON public.pastoral_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
);
CREATE POLICY "Admin puede escribir notas pastorales" ON public.pastoral_notes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
);


-- 5. TABLA SPIRITUAL RECORDS (Progreso Discipulado)
CREATE TABLE IF NOT EXISTS public.spiritual_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    bautizado BOOLEAN DEFAULT false,
    fecha_bautismo DATE,
    conectar BOOLEAN DEFAULT false,
    crecer BOOLEAN DEFAULT false,
    intro_lid BOOLEAN DEFAULT false,
    dones BOOLEAN DEFAULT false,
    aplicadas BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.spiritual_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario ve su espiritual record" ON public.spiritual_records;
DROP POLICY IF EXISTS "Admin puede modificar spiritual records" ON public.spiritual_records;

CREATE POLICY "Usuario ve su espiritual record" ON public.spiritual_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin puede modificar spiritual records" ON public.spiritual_records FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
);


-- 6. BUCKET DE STORAGE: AVATARS
-- Intentamos crearlo por código si no existe, asegurando que sea público para poder leer las fotos.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Borrar políticas previas del storage (por seguridad, evitamos error de policy already exists)
DROP POLICY IF EXISTS "Acceso publico a avatares" ON storage.objects;
DROP POLICY IF EXISTS "Autenticados pueden insertar avatar" ON storage.objects;
DROP POLICY IF EXISTS "Autenticados pueden actualizar avatar" ON storage.objects;

-- Lectura pública para cualquier avatar
CREATE POLICY "Acceso publico a avatares" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

-- Inserción: En Supabase Storage, no podemos validar `auth.uid() = owner` fácilmente en INSERT si no lo pasamos. 
-- Validamos que el usuario esté autenticado. (Un admin también está autenticado).
CREATE POLICY "Autenticados pueden insertar avatar" ON storage.objects 
  FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.uid() IS NOT NULL );

CREATE POLICY "Autenticados pueden actualizar avatar" ON storage.objects 
  FOR UPDATE USING ( bucket_id = 'avatars' AND auth.uid() IS NOT NULL );

CREATE POLICY "Autenticados pueden eliminar avatar" ON storage.objects 
  FOR DELETE USING ( bucket_id = 'avatars' AND auth.uid() IS NOT NULL );
