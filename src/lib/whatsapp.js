const WHATSAPP_ENDPOINT = '/api/whatsapp-notify'

export async function sendWhatsAppMessage({ to, recipients, message, templateName, languageCode, templateParams }) {
  const response = await fetch(WHATSAPP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, recipients, message, templateName, languageCode, templateParams })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error || 'Error enviando mensaje por WhatsApp')
  }

  return data
}

async function notifySubscribers(message, supabase) {
  const { data: subscribers, error } = await supabase
    .from('profiles')
    .select('phone')
    .eq('whatsapp_optin', true)
    .not('phone', 'is', null)

  if (error) throw error

  const recipients = subscribers
    .map(({ phone }) => phone)
    .filter(phone => String(phone).trim())

  if (recipients.length === 0) {
    return { success: true, summary: { total: 0, enviadosExitosamente: 0, fallidos: 0 }, detalles: [] }
  }

  return sendWhatsAppMessage({
    recipients,
    message
  })
}

export function notifySubscribersAboutDevocional(titulo, supabase) {
  return notifySubscribers(`Nuevo devocional disponible: ${titulo}`, supabase)
}

export function notifySubscribersAboutResource(title, category, supabase) {
  return notifySubscribers(`Nuevo material disponible: ${title} (${category})`, supabase)
}