-- =========================================================================
-- Migración MVP 11: IA Devocionales (n8n), Gamificación y Reportes
-- Iglesia Bautista Vida Nueva, Santiago, Chile
-- =========================================================================

-- 1. Actualizar tabla Devocionales con nuevos campos para la IA y fechas
ALTER TABLE public.devocionales
  ADD COLUMN IF NOT EXISTS aplicativo TEXT,
  ADD COLUMN IF NOT EXISTS preguntas JSONB,
  ADD COLUMN IF NOT EXISTS fecha_asignada DATE;

-- 2. Actualizar tabla Profiles con sistema de Gamificación (Rachas y Puntos)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS racha_actual INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS racha_maxima INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_devocional_completado_fecha DATE,
  ADD COLUMN IF NOT EXISTS puntos_totales INTEGER DEFAULT 0;

-- 3. Función RPC transaccional para Completar Devocional y calcular Rachas
CREATE OR REPLACE FUNCTION public.completar_devocional(
    p_devocional_id BIGINT,
    p_apreciacion TEXT,
    p_cambios TEXT,
    p_oracion_personal TEXT
)
RETURNS VOID SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
    v_hoy DATE;
    v_ultimo_completado DATE;
    v_racha_actual INTEGER;
    v_racha_maxima INTEGER;
    v_puntos INTEGER;
    v_ya_existia BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    v_hoy := (timezone('America/Santiago', now()))::date; -- Usar hora local de Chile para cortes exactos a medianoche

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- Verificar si ya completó este devocional específico antes (para no duplicar puntos)
    SELECT EXISTS(
        SELECT 1 FROM public.devotional_journal 
        WHERE user_id = v_user_id AND devocional_id = p_devocional_id
    ) INTO v_ya_existia;

    -- Guardar o actualizar en el diario (upsert)
    INSERT INTO public.devotional_journal (
        user_id, devocional_id, apreciacion, cambios, oracion_personal, created_at
    )
    VALUES (
        v_user_id, p_devocional_id, p_apreciacion, p_cambios, p_oracion_personal, now()
    )
    ON CONFLICT (user_id, devocional_id) DO UPDATE SET
        apreciacion = EXCLUDED.apreciacion,
        cambios = EXCLUDED.cambios,
        oracion_personal = EXCLUDED.oracion_personal,
        created_at = now();

    -- Si es la primera vez que completa este devocional, calcular rachas y puntos
    IF NOT v_ya_existia THEN
        
        -- Obtener estado actual del perfil
        SELECT 
            ultimo_devocional_completado_fecha, 
            COALESCE(racha_actual, 0), 
            COALESCE(racha_maxima, 0), 
            COALESCE(puntos_totales, 0)
        INTO 
            v_ultimo_completado, 
            v_racha_actual, 
            v_racha_maxima, 
            v_puntos
        FROM public.profiles
        WHERE id = v_user_id FOR UPDATE;

        -- Lógica de Racha
        IF v_ultimo_completado = v_hoy THEN
            -- Ya hizo un devocional hoy, no aumentar racha
            v_racha_actual := v_racha_actual;
        ELSIF v_ultimo_completado = (v_hoy - INTERVAL '1 day')::DATE THEN
            -- Hizo un devocional ayer, la racha continúa
            v_racha_actual := v_racha_actual + 1;
        ELSE
            -- Pasó más de 1 día (o es la primera vez), se resetea la racha a 1
            v_racha_actual := 1;
        END IF;

        -- Actualizar racha máxima
        IF v_racha_actual > v_racha_maxima THEN
            v_racha_maxima := v_racha_actual;
        END IF;

        -- Calcular puntos (10 base por devocional)
        v_puntos := v_puntos + 10;

        -- Bonus de 50 puntos cada 7 días de racha
        IF v_racha_actual > 0 AND v_racha_actual % 7 = 0 THEN
            v_puntos := v_puntos + 50;
        END IF;

        -- Guardar estado actualizado
        UPDATE public.profiles
        SET 
            racha_actual = v_racha_actual,
            racha_maxima = v_racha_maxima,
            ultimo_devocional_completado_fecha = v_hoy,
            puntos_totales = v_puntos
        WHERE id = v_user_id;

    END IF;
END;
$$ LANGUAGE plpgsql;
