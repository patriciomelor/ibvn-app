-- Guarda el consentimiento de WhatsApp enviado durante el registro.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_optin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_optin_date TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  opted_in BOOLEAN := COALESCE((new.raw_user_meta_data->>'whatsapp_optin')::BOOLEAN, FALSE);
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    nombre,
    tel,
    whatsapp_optin,
    whatsapp_optin_date,
    rol
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'name', 'Visita Nueva'),
    COALESCE(new.raw_user_meta_data->>'tel', ''),
    opted_in,
    CASE WHEN opted_in THEN COALESCE(
      (new.raw_user_meta_data->>'whatsapp_optin_date')::TIMESTAMPTZ,
      NOW()
    ) ELSE NULL END,
    COALESCE(new.raw_user_meta_data->>'rol', 'visita')
  )
  ON CONFLICT (id) DO UPDATE SET
    tel = COALESCE(EXCLUDED.tel, profiles.tel),
    nombre = COALESCE(EXCLUDED.nombre, profiles.nombre),
    whatsapp_optin = EXCLUDED.whatsapp_optin,
    whatsapp_optin_date = EXCLUDED.whatsapp_optin_date;

  INSERT INTO public.spiritual_records (user_id)
  VALUES (new.id)
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;