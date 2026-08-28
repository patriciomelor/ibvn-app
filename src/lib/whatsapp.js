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
    .select('nombre, tel')
    .eq('whatsapp_optin', true)
    .not('tel', 'is', null)

  if (error) throw error

  const recipients = subscribers
    .map(({ tel }) => tel)
    .filter(tel => String(tel).trim())

  if (recipients.length === 0) {
    return { success: true, summary: { total: 0, enviadosExitosamente: 0, fallidos: 0 }, detalles: [] }
  }

  return sendWhatsAppMessage({
    recipients,
    message
  })
}

export async function notifySubscribersAboutDevocional(titulo, supabase) {
  const { data: subscribers, error } = await supabase
    .from('profiles')
    .select('nombre, tel')
    .eq('whatsapp_optin', true)
    .not('tel', 'is', null)

  if (error) throw error

  if (subscribers.length === 0) {
    return { success: true, summary: { total: 0, enviadosExitosamente: 0, fallidos: 0 }, detalles: [] }
  }

  const results = []

  for (const { nombre, tel } of subscribers) {
    try {
      const res = await sendWhatsAppMessage({
        to: tel,
        templateName: 'ibvn_nuevo_devocional',
        languageCode: 'es_CL',
        templateParams: [nombre, titulo]
      })
      results.push(...(res.detalles || []))
    } catch (err) {
      results.push({
        phone: tel,
        status: 'error',
        error: err.message
      })
    }
  }

  const totalSuccess = results.filter(r => r.status === 'success').length
  const totalError = results.filter(r => r.status === 'error').length

  return {
    success: totalSuccess > 0,
    summary: {
      total: results.length,
      enviadosExitosamente: totalSuccess,
      fallidos: totalError
    },
    detalles: results
  }
}

export async function notifySubscribersAboutResource(title, category, supabase) {
  const { data: subscribers, error } = await supabase
    .from('profiles')
    .select('nombre, tel')
    .eq('whatsapp_optin', true)
    .not('tel', 'is', null)

  if (error) throw error

  if (subscribers.length === 0) {
    return { success: true, summary: { total: 0, enviadosExitosamente: 0, fallidos: 0 }, detalles: [] }
  }

  const results = []

  for (const { nombre, tel } of subscribers) {
    try {
      const res = await sendWhatsAppMessage({
        to: tel,
        templateName: 'ibvn_nuevo_recurso',
        languageCode: 'es_CL',
        templateParams: [nombre, title, category]
      })
      results.push(...(res.detalles || []))
    } catch (err) {
      results.push({
        phone: tel,
        status: 'error',
        error: err.message
      })
    }
  }

  const totalSuccess = results.filter(r => r.status === 'success').length
  const totalError = results.filter(r => r.status === 'error').length

  return {
    success: totalSuccess > 0,
    summary: {
      total: results.length,
      enviadosExitosamente: totalSuccess,
      fallidos: totalError
    },
    detalles: results
  }
}