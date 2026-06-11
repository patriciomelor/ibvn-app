-- =========================================================================
-- VIDA NUEVA APP - MIGRACIÓN SQL SUPER ADMIN Y VISIBILIDAD DE MÓDULOS
-- Iglesia Bautista Vida Nueva, Santiago, Chile
-- =========================================================================

-- 1. CREACIÓN DE TABLA DE VISIBILIDAD DE MÓDULOS
CREATE TABLE IF NOT EXISTS public.module_visibility (
    module_key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.module_visibility ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para module_visibility
CREATE POLICY "Permitir lectura de visibilidad a todo público" ON public.module_visibility
    FOR SELECT USING (true);

CREATE POLICY "Permitir administrar visibilidad a pastores" ON public.module_visibility
    FOR ALL USING (public.is_pastor_admin());

-- Semilla de configuración por defecto
INSERT INTO public.module_visibility (module_key, label, is_public) VALUES
('devocional', 'Devocional Diario', false),
('archive', 'Historial de Devocionales', false),
('misiones', 'Misiones', false),
('escuela', 'Escuela de Líderes', false),
('deportes', 'Deportes y Recreación', false),
('recursos', 'Biblioteca de Recursos', false)
ON CONFLICT (module_key) DO UPDATE SET label = EXCLUDED.label;


-- 2. FUNCIÓN RPC SEGURA PARA INCREMENTAR DESCARGAS (SECURITY DEFINER)
-- Evita tener que dar permisos de UPDATE generales en la tabla recursos a invitados (anon)
CREATE OR REPLACE FUNCTION public.increment_recurso_downloads(recurso_id BIGINT)
RETURNS VOID SECURITY DEFINER AS $$
BEGIN
    UPDATE public.recursos
    SET downloads_count = downloads_count + 1
    WHERE id = recurso_id;
END;
$$ LANGUAGE plpgsql;


-- 3. POLÍTICAS DINÁMICAS DE LECTURA PÚBLICA (BASADAS EN CONFIGURACIÓN)
-- Reemplaza las antiguas políticas SELECT para permitir el acceso a invitados (anon) si el módulo es configurado como público.

-- --- DEVOCIONALES ---
DROP POLICY IF EXISTS "Permitir ver devocionales a usuarios autenticados" ON public.devocionales;
CREATE POLICY "Permitir ver devocionales si es público o autenticado" ON public.devocionales
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        OR EXISTS (SELECT 1 FROM public.module_visibility WHERE module_key = 'devocional' AND is_public = true)
    );

-- --- MISIONEROS (Misiones - Ficha) ---
DROP POLICY IF EXISTS "Permitir ver misioneros a usuarios autenticados" ON public.missions_misioneros;
CREATE POLICY "Permitir ver misioneros si es público o autenticado" ON public.missions_misioneros
    FOR SELECT USING (
        auth.role() = 'authenticated'
        OR EXISTS (SELECT 1 FROM public.module_visibility WHERE module_key = 'misiones' AND is_public = true)
    );

-- --- RECURSOS (Biblioteca) ---
DROP POLICY IF EXISTS "Permitir ver recursos a usuarios autenticados" ON public.recursos;
CREATE POLICY "Permitir ver recursos si es público o autenticado" ON public.recursos
    FOR SELECT USING (
        auth.role() = 'authenticated'
        OR EXISTS (SELECT 1 FROM public.module_visibility WHERE module_key = 'recursos' AND is_public = true)
    );

-- --- ACTIVIDADES DEPORTIVAS ---
DROP POLICY IF EXISTS "Permitir ver actividades a usuarios autenticados" ON public.sports_activities;
CREATE POLICY "Permitir ver actividades si es público o autenticado" ON public.sports_activities
    FOR SELECT USING (
        auth.role() = 'authenticated'
        OR EXISTS (SELECT 1 FROM public.module_visibility WHERE module_key = 'deportes' AND is_public = true)
    );

-- --- REGISTROS DE INSCRIPCIONES DEPORTIVAS ---
-- Requerido para contar inscripciones como invitado
DROP POLICY IF EXISTS "Permitir ver inscripciones a usuarios autenticados" ON public.sports_registrations;
CREATE POLICY "Permitir ver inscripciones si es público o autenticado" ON public.sports_registrations
    FOR SELECT USING (
        auth.role() = 'authenticated'
        OR EXISTS (SELECT 1 FROM public.module_visibility WHERE module_key = 'deportes' AND is_public = true)
    );
