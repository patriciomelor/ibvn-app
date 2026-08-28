-- =========================================================================
-- Migración MVP 6: Paleta de Colores y Accesibilidad Visual
-- Iglesia Bautista Vida Nueva, Santiago, Chile
-- =========================================================================

-- 1. COLUMNA DE PALETA DE COLORES EN PROFILES
-- Guarda la preferencia de paleta de colores del usuario (e.g. 'light-classic', 'light-sepia', 'dark-oled', etc.)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS theme_palette TEXT DEFAULT 'light-classic';
