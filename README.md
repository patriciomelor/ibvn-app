<div align="center">
  <img src="public/favicon.png" alt="IBVN Logo" width="120" style="border-radius: 20px; box-shadow: 0 4px 14px 0 rgba(0,0,0,0.1);" />
  
  <br />
  <br />
  
  # 📱 IBVN App 
  
  **Aplicación Oficial de la Iglesia Bautista Vida Nueva**
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#)
</div>

---

<br />

## 📖 Descripción del Proyecto

**IBVN App** es una plataforma integral (Progressive Web App) diseñada para la comunidad de la Iglesia Bautista Vida Nueva. Proporciona herramientas tanto para los miembros (devocionales, recursos, calendario) como para la administración pastoral (gestión de miembros, CRM espiritual, ministerios).

---

## ✨ Funcionalidades Principales

<div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">

### 👤 Para la Congregación (Usuarios)
- **Devocionales Semanales**: Reflexiones diarias con modo de lectura inmersiva.
- **Registro y Perfil Personal**: Gestión de datos de contacto, foto de perfil (avatar) y estado espiritual.
- **Preferencias Inteligentes**: Modo claro/oscuro y Opt-in de notificaciones por WhatsApp.
- **Instalable (PWA)**: Se puede instalar en iOS y Android como una app nativa, directamente desde el navegador.

### 🛡️ Para Administración Pastoral (Admin)
- **CRM Pastoral Avanzado**: Seguimiento detallado del estado espiritual de cada miembro.
- **Dashboard de Alertas**: Identificación de miembros inactivos o que requieren seguimiento.
- **Generador IA (Opcional)**: Transcripción de audios de sermones.
- **Gestión de Visibilidad**: Control para activar/ocultar módulos (Misiones, Escuela, Actividades) sin afectar el backend.
- **Gestión de Ministerios y Células**: Asignación de roles y responsabilidades.

</div>

---

## 🚀 Tecnologías

Este proyecto está construido con un stack moderno y escalable:

- **Frontend**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) (Glassmorphism & diseño responsivo)
- **Iconografía**: [Lucide React](https://lucide.dev/)
- **Backend as a Service**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **PWA**: `vite-plugin-pwa` para Service Workers y manifiesto dinámico.
- **Hosting**: [Vercel](https://vercel.com/) (Recomendado)

---

## 🛠️ Instalación y Desarrollo Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/ibvn-app.git
cd ibvn-app
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en el ejemplo:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Ejecutar entorno de desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

---

## 🗄️ Base de Datos (Supabase)

Para desplegar la base de datos, ejecuta las migraciones SQL en el editor de tu proyecto Supabase:

1. Ejecuta `supabase_schema.sql` (Crea la estructura base).
2. Ejecuta `supabase_migration_mvpX.sql` de forma secuencial (para actualizaciones posteriores).
3. Asegúrate de ejecutar el último script para storage de avatares: `supabase_migration_mvp5_whatsapp.sql`.

---

<div align="center">
  <p>Desarrollado con ❤️ para IBVN.</p>
</div>
