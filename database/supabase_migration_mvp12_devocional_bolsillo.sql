-- =========================================================================
-- Migración MVP 12: Devocional Semanal en Formato Libro de Bolsillo (A6)
-- Iglesia Bautista Vida Nueva, Santiago, Chile
-- =========================================================================

-- 1. Nuevas columnas en tabla devocionales para soporte del formato bolsillo (7 días)
ALTER TABLE public.devocionales
  ADD COLUMN IF NOT EXISTS dia_nombre TEXT,             -- Ej: 'Lunes', 'Martes', etc.
  ADD COLUMN IF NOT EXISTS dia_numero INTEGER,          -- 1 a 7
  ADD COLUMN IF NOT EXISTS gratitud_pregunta TEXT,      -- Pregunta corta disparadora (máx 10 palabras)
  ADD COLUMN IF NOT EXISTS accion TEXT,                 -- Acción pequeña y concreta para el día (máx 10 palabras)
  ADD COLUMN IF NOT EXISTS sermon_titulo TEXT,          -- Título del sermón dominical base
  ADD COLUMN IF NOT EXISTS sermon_predicador TEXT,      -- Nombre del predicador
  ADD COLUMN IF NOT EXISTS sermon_fecha DATE,           -- Fecha del sermón dominical
  ADD COLUMN IF NOT EXISTS sermon_texto_base TEXT,      -- Pasaje bíblico principal del sermón
  ADD COLUMN IF NOT EXISTS sermon_version TEXT;         -- Versión bíblica utilizada (ej: RVR1960, RV1909, LBLA)

-- 2. Nuevas columnas en tabla devotional_journal para registrar las 3 gratitudes y la acción diaria
ALTER TABLE public.devotional_journal
  ADD COLUMN IF NOT EXISTS gratitud_1 TEXT,
  ADD COLUMN IF NOT EXISTS gratitud_2 TEXT,
  ADD COLUMN IF NOT EXISTS gratitud_3 TEXT,
  ADD COLUMN IF NOT EXISTS accion_completada BOOLEAN DEFAULT FALSE;

-- 3. Actualizar función RPC completar_devocional para soportar los nuevos campos de bolsillo
CREATE OR REPLACE FUNCTION public.completar_devocional(
    p_devocional_id BIGINT,
    p_apreciacion TEXT DEFAULT '',
    p_cambios TEXT DEFAULT '',
    p_oracion_personal TEXT DEFAULT '',
    p_gratitud_1 TEXT DEFAULT '',
    p_gratitud_2 TEXT DEFAULT '',
    p_gratitud_3 TEXT DEFAULT '',
    p_accion_completada BOOLEAN DEFAULT FALSE
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
    v_apreciacion_final TEXT;
    v_cambios_final TEXT;
BEGIN
    v_user_id := auth.uid();
    v_hoy := (timezone('America/Santiago', now()))::date;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- Concatenar respuestas de gratitud a apreciacion si p_apreciacion viene vacía (compatibilidad)
    IF COALESCE(p_apreciacion, '') = '' AND (COALESCE(p_gratitud_1, '') <> '' OR COALESCE(p_gratitud_2, '') <> '' OR COALESCE(p_gratitud_3, '') <> '') THEN
        v_apreciacion_final := CONCAT_WS(E'\n', 
            NULLIF(CONCAT('1. ', p_gratitud_1), '1. '),
            NULLIF(CONCAT('2. ', p_gratitud_2), '2. '),
            NULLIF(CONCAT('3. ', p_gratitud_3), '3. ')
        );
    ELSE
        v_apreciacion_final := COALESCE(p_apreciacion, '');
    END IF;

    -- Mapear acción a cambios si p_cambios viene vacía
    IF COALESCE(p_cambios, '') = '' AND p_accion_completada THEN
        v_cambios_final := 'Acción diaria realizada';
    ELSE
        v_cambios_final := COALESCE(p_cambios, '');
    END IF;

    -- Verificar si ya completó este devocional específico antes (para no duplicar puntos)
    SELECT EXISTS(
        SELECT 1 FROM public.devotional_journal 
        WHERE user_id = v_user_id AND devocional_id = p_devocional_id
    ) INTO v_ya_existia;

    -- Guardar o actualizar en el diario (upsert)
    INSERT INTO public.devotional_journal (
        user_id, 
        devocional_id, 
        apreciacion, 
        cambios, 
        oracion_personal,
        gratitud_1,
        gratitud_2,
        gratitud_3,
        accion_completada,
        created_at
    )
    VALUES (
        v_user_id, 
        p_devocional_id, 
        v_apreciacion_final, 
        v_cambios_final, 
        COALESCE(p_oracion_personal, ''),
        COALESCE(p_gratitud_1, ''),
        COALESCE(p_gratitud_2, ''),
        COALESCE(p_gratitud_3, ''),
        COALESCE(p_accion_completada, FALSE),
        now()
    )
    ON CONFLICT (user_id, devocional_id) DO UPDATE SET
        apreciacion = EXCLUDED.apreciacion,
        cambios = EXCLUDED.cambios,
        oracion_personal = EXCLUDED.oracion_personal,
        gratitud_1 = EXCLUDED.gratitud_1,
        gratitud_2 = EXCLUDED.gratitud_2,
        gratitud_3 = EXCLUDED.gratitud_3,
        accion_completada = EXCLUDED.accion_completada,
        created_at = now();

    -- Si es la primera vez que completa este devocional, calcular rachas y puntos
    IF NOT v_ya_existia THEN
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
            v_racha_actual := v_racha_actual;
        ELSIF v_ultimo_completado = (v_hoy - INTERVAL '1 day')::DATE THEN
            v_racha_actual := v_racha_actual + 1;
        ELSE
            v_racha_actual := 1;
        END IF;

        IF v_racha_actual > v_racha_maxima THEN
            v_racha_maxima := v_racha_actual;
        END IF;

        -- 10 puntos base por devocional
        v_puntos := v_puntos + 10;

        -- Bono de 50 puntos al alcanzar múltiplos de 7 días (semana completa)
        IF v_racha_actual > 0 AND v_racha_actual % 7 = 0 THEN
            v_puntos := v_puntos + 50;
        END IF;

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
