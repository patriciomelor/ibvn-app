-- =========================================================================
-- Migración MVP 7: Recursos Destacados Adaptativos
-- Iglesia Bautista Vida Nueva, Santiago, Chile
-- =========================================================================

-- 1. COLUMNA DE RECURSO DESTACADO EN LA TABLA RECURSOS
-- Permite marcar un recurso como destacado para que aparezca en el bloque superior
ALTER TABLE public.recursos 
  ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT FALSE;
