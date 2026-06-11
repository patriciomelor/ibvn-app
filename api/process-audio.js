import { OpenAI, toFile } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Inicializar clientes
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// El cliente de Supabase necesita la Service Role Key para descargar sin RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'filePath es requerido' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase Service Client no configurado en Vercel' });
    }

    // 1. Descargar audio de Supabase Storage
    console.log(`Descargando ${filePath} desde Supabase...`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('audio_uploads')
      .download(filePath);

    if (downloadError) throw downloadError;

    // Preparar el archivo para OpenAI
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = filePath.split('.').pop() || 'm4a';
    const file = await toFile(buffer, `audio.${ext}`, { type: fileData.type });

    // 2. Transcribir con OpenAI Whisper
    console.log('Transcribiendo audio con Whisper...');
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'text',
      language: 'es'
    });
    
    console.log(`Transcripción completada. Longitud: ${transcription.length} caracteres.`);

    // 3. Procesar con Claude 3.5 Sonnet
    console.log('Generando contenido del devocional con Claude...');
    const prompt = `Eres un asistente pastoral para la "Vida Nueva App" de la Iglesia Bautista Vida Nueva en Santiago, Chile.
Tu tarea es tomar la siguiente transcripción de un audio devocional grabado por un pastor, y generar el contenido estructurado final para la app.

INSTRUCCIONES CLAVES:
- Mantén la fidelidad del mensaje bíblico y pastoral original.
- Corrige muletillas, tartamudeos y mejora la gramática sin perder el tono conversacional.
- Estructura el cuerpo del texto en párrafos cortos (3-4 líneas máximo) para lectura ágil en móviles.

FORMATO DE SALIDA:
Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta (sin formato markdown adicional ni bloques \`\`\`json):
{
  "titulo": "Un título breve y atractivo (max 60 chars)",
  "versiculo_referencia": "Ej: Juan 3:16 (LBLA)",
  "versiculo_texto": "El texto bíblico clave mencionado en el audio",
  "cuerpo_texto": "El contenido principal del devocional estructurado en HTML muy básico (solo etiquetas <p> y <strong>)",
  "frase_reflexion": "Una frase corta y poderosa (max 100 chars) para reflexionar durante el día"
}

Transcripción del pastor:
"""
${transcription}
"""
`;

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const claudeText = claudeResponse.content[0].text;
    
    let devocionalData;
    try {
      devocionalData = JSON.parse(claudeText.trim());
    } catch (e) {
      // Intentar limpiar si Claude devolvió markdown
      const jsonMatch = claudeText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        devocionalData = JSON.parse(jsonMatch[1].trim());
      } else {
        console.error("Claude raw text:", claudeText);
        throw new Error("Claude no devolvió un JSON válido.");
      }
    }

    return res.status(200).json({
      success: true,
      transcription: transcription,
      devocional: devocionalData
    });

  } catch (error) {
    console.error('Error en process-audio:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Error interno del servidor' 
    });
  }
}
