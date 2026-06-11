-- MIGRACIÓN 02: DEPORTES, RECURSOS Y ALERTAS CRM

-- 1. TABLA SPORTS ACTIVITIES (Deportes y Recreación)
CREATE TABLE IF NOT EXISTS public.sports_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    sport_type TEXT NOT NULL DEFAULT 'Fútbol / Baby Fútbol',
    datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    place TEXT NOT NULL,
    limit_slots INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sports_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de actividades deportivas" ON public.sports_activities;
DROP POLICY IF EXISTS "Lideres pueden gestionar actividades deportivas" ON public.sports_activities;

CREATE POLICY "Lectura pública de actividades deportivas" ON public.sports_activities FOR SELECT USING (true);
CREATE POLICY "Lideres pueden gestionar actividades deportivas" ON public.sports_activities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (rol = 'pastor_admin' OR rol = 'lider'))
);


-- 2. TABLA SPORTS REGISTRATIONS (Inscripciones Deportivas)
CREATE TABLE IF NOT EXISTS public.sports_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES public.sports_activities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(activity_id, user_id) -- Un usuario no puede inscribirse dos veces al mismo partido
);

ALTER TABLE public.sports_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica inscripciones" ON public.sports_registrations;
DROP POLICY IF EXISTS "Usuario puede inscribirse" ON public.sports_registrations;
DROP POLICY IF EXISTS "Usuario puede cancelar inscripcion" ON public.sports_registrations;
DROP POLICY IF EXISTS "Lideres pueden eliminar inscripciones" ON public.sports_registrations;

CREATE POLICY "Lectura publica inscripciones" ON public.sports_registrations FOR SELECT USING (true);
CREATE POLICY "Usuario puede inscribirse" ON public.sports_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuario puede cancelar inscripcion" ON public.sports_registrations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Lideres pueden eliminar inscripciones" ON public.sports_registrations FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (rol = 'pastor_admin' OR rol = 'lider'))
);

-- FUNCIÓN PARA PREVENIR INSCRIPCIÓN SI NO HAY CUPOS
CREATE OR REPLACE FUNCTION check_sports_slots() RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_slots INTEGER;
BEGIN
  SELECT count(*) INTO current_count FROM public.sports_registrations WHERE activity_id = NEW.activity_id;
  SELECT limit_slots INTO max_slots FROM public.sports_activities WHERE id = NEW.activity_id;
  
  IF current_count >= max_slots THEN
    RAISE EXCEPTION 'No quedan cupos disponibles para esta actividad.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_sports_slots ON public.sports_registrations;
CREATE TRIGGER tr_check_sports_slots
  BEFORE INSERT ON public.sports_registrations
  FOR EACH ROW EXECUTE FUNCTION check_sports_slots();


-- 3. TABLA RECURSOS (Biblioteca / Manuales)
CREATE TABLE IF NOT EXISTS public.recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Manuales',
    file_url TEXT NOT NULL,
    downloads_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.recursos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública recursos" ON public.recursos;
DROP POLICY IF EXISTS "Admin gestiona recursos" ON public.recursos;

CREATE POLICY "Lectura pública recursos" ON public.recursos FOR SELECT USING (true);
CREATE POLICY "Admin gestiona recursos" ON public.recursos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (rol = 'pastor_admin' OR rol = 'lider'))
);


-- 4. TABLA PEOPLE ALERTS (Alertas de inactividad o métricas del CRM)
CREATE TABLE IF NOT EXISTS public.people_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL, -- ej: Inactividad, Bautismo Pendiente, etc
    descripcion TEXT,
    resuelta BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.people_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lideres ven alertas" ON public.people_alerts;
DROP POLICY IF EXISTS "Lideres gestionan alertas" ON public.people_alerts;

CREATE POLICY "Lideres ven alertas" ON public.people_alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (rol = 'pastor_admin' OR rol = 'lider'))
);
CREATE POLICY "Lideres gestionan alertas" ON public.people_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (rol = 'pastor_admin' OR rol = 'lider'))
);
