import posthog from 'posthog-js'

// Inicializar PostHog si las credenciales están disponibles
export const initAnalytics = () => {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      // Deshabilitar grabación de sesiones en local por defecto para desarrollo
      disable_session_recording: import.meta.env.DEV,
      autocapture: true, // Captura automáticamente clicks y pageviews
    });
  } else {
    console.warn('PostHog: VITE_POSTHOG_KEY no configurado, analíticas deshabilitadas.');
  }
};

/**
 * Registra un evento personalizado en PostHog
 * @param {string} eventName - Nombre del evento (ej: 'devotional_viewed')
 * @param {object} properties - Propiedades adicionales (ej: { id: 123 })
 */
export const trackEvent = (eventName, properties = {}) => {
  if (posthog.__loaded) {
    posthog.capture(eventName, properties);
  }
};

/**
 * Identifica a un usuario en PostHog una vez que hace login
 * @param {string} userId - UUID del usuario en Supabase
 * @param {object} traits - Datos del usuario (rol, nombre, etc.)
 */
export const identifyUser = (userId, traits = {}) => {
  if (posthog.__loaded) {
    posthog.identify(userId, traits);
  }
};

/**
 * Limpia la sesión del usuario al hacer logout
 */
export const resetUser = () => {
  if (posthog.__loaded) {
    posthog.reset();
  }
};
