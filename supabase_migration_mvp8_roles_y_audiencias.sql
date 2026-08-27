-- =========================================================================
-- Migración MVP 8: Rol 'Visita' y Audiencia Objetiva de Recursos
-- Iglesia Bautista Vida Nueva, Santiago, Chile
-- =========================================================================

-- 1. ACTUALIZAR CHECK CONSTRAINT DE ROL EN PROFILES
-- Permite los roles: 'visita', 'miembro', 'lider', 'pastor_admin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_rol_check 
  CHECK (rol IN ('visita', 'miembro', 'lider', 'pastor_admin'));

-- Establecer el rol por defecto en registros a 'visita'
ALTER TABLE public.profiles ALTER COLUMN rol SET DEFAULT 'visita';

-- 2. AGREGAR COLUMNA TARGET_AUDIENCE A LA TABLA RECURSOS
-- Permite definir a quién está dirigido el recurso: 'visita', 'miembro', 'lider'
ALTER TABLE public.recursos 
  ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'visita';

-- Agregar check constraint para target_audience
ALTER TABLE public.recursos DROP CONSTRAINT IF EXISTS recursos_target_audience_check;
ALTER TABLE public.recursos ADD CONSTRAINT recursos_target_audience_check
  CHECK (target_audience IN ('visita', 'miembro', 'lider'));
