// Vercel Serverless Function: Integración con Kapso (WhatsApp Business)

function sanitizeChileanPhone(phoneStr) {
  if (!phoneStr) return ''
  // Eliminar todo lo que no sea número
  let cleaned = String(phoneStr).replace(/\D/g, '')

  // Si tiene 9 dígitos y empieza con 9 (ej. 912345678), agregar el prefijo 56 de Chile
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    cleaned = '56' + cleaned
  }
  // Si tiene 8 dígitos y es celular chileno (ej. 87654321), agregar 569
  else if (cleaned.length === 8) {
    cleaned = '569' + cleaned
  }

  return cleaned
}

export default async function handler(req, res) {
  // Configuración de encabezados CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' })
  }

  try {
    const apiKey = process.env.KAPSO_API_KEY
    const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID

    if (!apiKey || !phoneNumberId) {
      return res.status(500).json({
        error: 'Las credenciales de Kapso (KAPSO_API_KEY y KAPSO_PHONE_NUMBER_ID) no están configuradas en las variables de entorno de Vercel.'
      })
    }

    const { to, recipients, message } = req.body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'El campo "message" es requerido y no puede estar vacío.' })
    }

    // Lista de números a los que enviar
    let targetNumbers = []

    if (to) {
      targetNumbers.push(to)
    } else if (Array.isArray(recipients) && recipients.length > 0) {
      targetNumbers = recipients
    } else {
      return res.status(400).json({ error: 'Debes proporcionar "to" (un número) o "recipients" (arreglo de números).' })
    }

    const results = []
    const kapsoUrl = `https://api.kapso.ai/meta/whatsapp/v24.0/${phoneNumberId}/messages`

    for (const rawPhone of targetNumbers) {
      const formattedPhone = sanitizeChileanPhone(rawPhone)

      if (!formattedPhone || formattedPhone.length < 11) {
        results.push({
          phone: rawPhone,
          status: 'error',
          error: 'Número de teléfono no válido o incompleto'
        })
        continue
      }

      try {
        const response = await fetch(kapsoUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'text',
            text: { body: message.trim() }
          })
        })

        const responseData = await response.json()

        if (!response.ok) {
          results.push({
            phone: formattedPhone,
            status: 'error',
            statusCode: response.status,
            error: responseData?.error || responseData || 'Error enviando mensaje por Kapso'
          })
        } else {
          results.push({
            phone: formattedPhone,
            status: 'success',
            data: responseData
          })
        }
      } catch (sendErr) {
        results.push({
          phone: formattedPhone,
          status: 'error',
          error: sendErr.message || 'Error de conexión con Kapso'
        })
      }
    }

    const totalSuccess = results.filter(r => r.status === 'success').length
    const totalError = results.filter(r => r.status === 'error').length

    return res.status(200).json({
      success: totalSuccess > 0,
      summary: {
        total: results.length,
        enviadosExitosamente: totalSuccess,
        fallidos: totalError
      },
      detalles: results
    })

  } catch (error) {
    console.error('Error interno en api/whatsapp-notify:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
}
