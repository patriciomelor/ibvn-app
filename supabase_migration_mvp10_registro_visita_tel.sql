-- =========================================================================
-- Migración MVP 10: Guardar Teléfono de Contacto y Forzar Rol 'visita' por defecto
-- Iglesia Bautista Vida Nueva, Santiago, Chile
-- =========================================================================

-- 1. ACTUALIZAR TRIGGER DE REGISTRO EN AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, tel, rol)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'name', 'Visita Nueva'),
    COALESCE(new.raw_user_meta_data->>'tel', ''),
    COALESCE(new.raw_user_meta_data->>'rol', 'visita')
  )
  ON CONFLICT (id) DO UPDATE SET
    tel = COALESCE(EXCLUDED.tel, profiles.tel),
    nombre = COALESCE(EXCLUDED.nombre, profiles.nombre);

  INSERT INTO public.spiritual_records (user_id)
  VALUES (new.id)
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ACTUALIZAR FUNCIÓN RPC ENSURE_PROFILE_EXISTS (AUTO-HEALING)
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS VOID SECURITY DEFINER AS $$
DECLARE
    user_email TEXT;
    user_nombre TEXT;
    user_tel TEXT;
    user_rol TEXT;
BEGIN
    SELECT 
      email, 
      COALESCE(raw_user_meta_data->>'nombre', raw_user_meta_data->>'name', 'Visita Nueva'),
      COALESCE(raw_user_meta_data->>'tel', ''),
      COALESCE(raw_user_meta_data->>'rol', 'visita')
    INTO user_email, user_nombre, user_tel, user_rol
    FROM auth.users
    WHERE id = auth.uid();

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN
        INSERT INTO public.profiles (id, email, nombre, tel, rol)
        VALUES (auth.uid(), user_email, user_nombre, user_tel, user_rol);
    ELSE
        -- Si el perfil existe pero no tenía teléfono guardado, actualizarlo con el metadata de auth
        UPDATE public.profiles
        SET tel = user_tel
        WHERE id = auth.uid() AND (tel IS NULL OR tel = '') AND user_tel IS NOT NULL AND user_tel <> '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.spiritual_records WHERE user_id = auth.uid()) THEN
        INSERT INTO public.spiritual_records (user_id)
        VALUES (auth.uid());
    END IF;
END;
$$ LANGUAGE plpgsql;
