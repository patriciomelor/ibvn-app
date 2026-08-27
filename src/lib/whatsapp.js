// Utilidad para envío de mensajes por WhatsApp a través del conector Kapso

/**
 * Normaliza un número chileno al formato internacional E.164 (ej. 56912345678)
 */
export function formatChileanPhone(phoneStr) {
  if (!phoneStr) return ''
  let cleaned = String(phoneStr).replace(/\D/g, '')

  // Si tiene 9 dígitos y empieza con 9 (ej. 912345678), agregar 56
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    cleaned = '56' + cleaned
  }
  // Si tiene 8 dígitos y empieza con 9 u 8, agregar 569
  else if (cleaned.length === 8) {
    cleaned = '569' + cleaned
  }

  return cleaned
}

/**
 * Llama al endpoint servidor /api/whatsapp-notify para enviar un mensaje
 */
export async function sendWhatsAppMessage({ to, recipients, message }) {
  try {
    const response = await fetch('/api/whatsapp-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, recipients, message })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || data.error || 'Error al comunicarse con el servidor de WhatsApp')
    }

    return data
  } catch (error) {
    console.error('Error en sendWhatsAppMessage:', error)
    throw error
  }
}

/**
 * Notifica automáticamente a todos los miembros que activaron WhatsApp Opt-In
 * cuando se publica un nuevo devocional
 */
export async function notifySubscribersAboutDevocional(devocionalTitle, supabaseClient) {
  try {
    if (!supabaseClient) {
      console.warn('Cliente Supabase no disponible para notificaciones WhatsApp')
      return { success: false, reason: 'Sin cliente Supabase' }
    }

    // 1. Consultar usuarios con opt-in activo y teléfono registrado
    const { data: subscribers, error } = await supabaseClient
      .from('profiles')
      .select('nombre, tel, whatsapp_optin')
      .eq('whatsapp_optin', true)
      .not('tel', 'is', null)

    if (error) {
      console.error('Error obteniendo miembros para WhatsApp:', error)
      return { success: false, error: error.message }
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No hay miembros con notificaciones de WhatsApp activas')
      return { success: true, message: 'No hay suscriptores con WhatsApp opt-in' }
    }

    // 2. Extraer números de teléfono válidos
    const validPhones = subscribers
      .map(s => formatChileanPhone(s.tel))
      .filter(phone => phone && phone.length >= 11)

    if (validPhones.length === 0) {
      return { success: true, message: 'Ningún suscriptor tiene un teléfono válido registrado' }
    }

    // 3. Formatear mensaje
    const messageText = `📖 *Nuevo Devocional Disponible en Vida Nueva App*\n\nHola, ya está disponible el devocional de hoy: *"${devocionalTitle}"*.\n\nIngresa a la aplicación para leer el pasaje bíblico y registrar tus reflexiones.`

    // 4. Enviar a través del servidor
    const result = await sendWhatsAppMessage({
      recipients: validPhones,
      message: messageText
    })

    return result

  } catch (err) {
    console.error('Error enviando notificaciones de devocional:', err)
    return { success: false, error: err.message }
  }
}
