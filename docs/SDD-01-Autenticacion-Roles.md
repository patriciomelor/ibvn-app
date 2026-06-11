# SDD-01: Autenticación y Roles

## 1. Nombre y Owner del módulo
- **Módulo**: Autenticación y Control de Acceso (Roles)
- **Owner**: Patricio / Álvaro (Líderes Técnicos)

## 2. Contexto y motivación
Para administrar el acceso a la plataforma "Vida Nueva App", es necesario contar con un sistema robusto de autenticación. De acuerdo a la Revisión de Arquitectura, el objetivo para el MVP1 y MVP2 es mantener el sistema simple para acelerar el desarrollo y reducir la carga operativa. Se ha decidido usar Supabase Auth y consolidar los niveles de acceso en solo 3 roles fundamentales.

## 3. Requerimientos Funcionales Priorizados (MoSCoW)

### Must Have
- Registro de usuarios mediante Email/Password.
- Login y Logout de usuarios.
- Asignación automática del rol `miembro` al momento del registro.
- Visualización de la Zona Pública y Journaling privado para el rol `miembro`.
- Panel de administración para asignar roles de `lider` y `pastor_admin`.

### Should Have
- Recuperación de contraseña (Forgot password flow).
- Redirección automática según el rol post-login.

### Could Have
- Social login (Google, Apple) - *Diferido para futuros MVPs*.

### Won't Have (en MVP1/2)
- Flujo de creación de cuenta por WhatsApp.
- Roles granulados (`colaborador`, `asistente`, `super admin`).

## 4. Requerimientos No Funcionales
- **Seguridad**: Las contraseñas deben estar encriptadas (Supabase Auth nativo).
- **Privacidad**: RLS (Row Level Security) aplicado estrictamente; un miembro solo puede ver sus propios registros privados.
- **Performance**: El chequeo de sesión no debe bloquear la renderización de la app inicial (PWA).

## 5. High Level Solution

El sistema utilizará el proveedor de autenticación de Supabase junto a un esquema de metadatos o una tabla `profiles` sincronizada con un trigger, donde se almacenará el rol de cada usuario.

```mermaid
flowchart TD
    A[Usuario (Email/Pass)] -->|Supabase Auth| B{Validación}
    B -->|Éxito| C[Asignación de JWT]
    C --> D[Consultar Tabla profiles/Roles]
    D --> E{¿Qué rol tiene?}
    E -->|miembro| F[Acceso Zona Pública y Privada propia]
    E -->|lider| G[Acceso Vista Grupo / Broadcast WhatsApp]
    E -->|pastor_admin| H[Acceso CRM y Configuración]
```

## 6. Low Level Solution

### Esquema de Base de Datos y RLS
Se sugiere el siguiente esquema simplificado en Supabase:

```sql
-- Tabla perfiles (se asume existencia previa, pero se ajusta)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  role text DEFAULT 'miembro' CHECK (role IN ('miembro', 'lider', 'pastor_admin')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para crear el perfil automáticamente al registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    'miembro'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies Base
- `profiles`: Select para sí mismo, y todos para `pastor_admin`.
- `journal`: Select/Insert/Update/Delete solo para el owner del registro (uid).

## 7. Fuera de Scope (Explícito)
- Complejidad de 5 niveles de roles.
- Roles de "super admin" separados del `pastor_admin`.
- Diferenciación de roles entre "colaborador" y "líder".

## 8. Criterios de Aceptación
- Un usuario recién registrado puede ver la app como `miembro`.
- Un `miembro` no puede modificar el campo de rol de su perfil en la base de datos (seguridad de API).
- Un `pastor_admin` puede cambiar el rol de otro usuario de `miembro` a `lider` usando una función segura.
- Los RLS deniegan el acceso a datos sensibles (ej. CRM) a los usuarios con rol `miembro`.

## 9. Riesgos técnicos identificados
- **Desincronización JWT vs Database**: Si un `pastor_admin` cambia el rol de un usuario, el JWT del usuario puede quedar desactualizado hasta que vuelva a hacer login. Para evitar esto, las policies RLS deben chequear la tabla `profiles` o usar claims actualizados.
- **Dificultad de migración futura**: Si en el MVP3 se agregan roles, puede ser necesario hacer un data patch en las tablas o actualizar todas las RLS policies. Se mitigará utilizando funciones (ej. `auth.has_role('lider')`).
