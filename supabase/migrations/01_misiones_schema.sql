-- MIGRACIÓN 01: MÓDULO DE MISIONES Y POSTULACIONES

-- 1. TABLA MISIONES (Viajes Misioneros)
CREATE TABLE IF NOT EXISTS public.misiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    destino TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    cupos INTEGER DEFAULT 0,
    descripcion TEXT,
    estado TEXT DEFAULT 'abierta', -- abierta, cerrada, completada
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.misiones ENABLE ROW LEVEL SECURITY;

-- Políticas Misiones
DROP POLICY IF EXISTS "Lectura pública misiones" ON public.misiones;
DROP POLICY IF EXISTS "Admin puede gestionar misiones" ON public.misiones;

CREATE POLICY "Lectura pública misiones" ON public.misiones FOR SELECT USING (true);
CREATE POLICY "Admin puede gestionar misiones" ON public.misiones FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
);


-- 2. TABLA MISIONES POSTULACIONES (Inscripciones)
CREATE TABLE IF NOT EXISTS public.misiones_postulaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mision_id UUID REFERENCES public.misiones(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    motivacion TEXT,
    estado TEXT DEFAULT 'pendiente', -- pendiente, aprobado, rechazado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(mision_id, user_id) -- Un usuario solo puede postular una vez por viaje
);

ALTER TABLE public.misiones_postulaciones ENABLE ROW LEVEL SECURITY;

-- Políticas Postulaciones
DROP POLICY IF EXISTS "Ver propias postulaciones" ON public.misiones_postulaciones;
DROP POLICY IF EXISTS "Admin ve todas las postulaciones" ON public.misiones_postulaciones;
DROP POLICY IF EXISTS "Insertar propia postulación" ON public.misiones_postulaciones;
DROP POLICY IF EXISTS "Actualizar propia postulación" ON public.misiones_postulaciones;
DROP POLICY IF EXISTS "Admin puede actualizar postulaciones" ON public.misiones_postulaciones;

CREATE POLICY "Ver propias postulaciones" ON public.misiones_postulaciones 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin ve todas las postulaciones" ON public.misiones_postulaciones 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
  );

CREATE POLICY "Insertar propia postulación" ON public.misiones_postulaciones 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Actualizar propia postulación" ON public.misiones_postulaciones 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin puede actualizar postulaciones" ON public.misiones_postulaciones 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
  );

-- 3. BUCKET DE STORAGE: MISIONES (Para fotos de portada del viaje)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('misiones', 'misiones', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Acceso publico imagenes misiones" ON storage.objects;
DROP POLICY IF EXISTS "Admin puede subir imagenes misiones" ON storage.objects;

CREATE POLICY "Acceso publico imagenes misiones" ON storage.objects FOR SELECT USING ( bucket_id = 'misiones' );
CREATE POLICY "Admin puede subir imagenes misiones" ON storage.objects FOR ALL USING (
  bucket_id = 'misiones' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'pastor_admin')
);
