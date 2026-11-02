import { OpenAI, toFile } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Los clientes se crean dentro del handler: si falta una API key, el SDK de OpenAI
// lanza una excepción al instanciarse y, si eso ocurre al cargar el módulo, Vercel
// responde FUNCTION_INVOCATION_FAILED (HTML) en lugar de un JSON con el error.
function getClients() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const missing = [];
  if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  // El cliente de Supabase necesita la Service Role Key para descargar sin RLS
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    throw new Error(`Faltan variables de entorno en Vercel: ${missing.join(', ')}`);
  }
  return {
    openai: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    anthropic: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
    supabase: createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

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

    const { openai, anthropic, supabase } = getClients();

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
    const prompt = `Eres un redactor pastoral de la Iglesia Bautista Vida Nueva (IBVN).
Tu tarea es convertir la transcripción de un audio o sermón en un devocional diario en formato de libro de bolsillo (A6), estilo Charles Spurgeon.

REGLAS DE ESTILO:
- Abre con una observación aguda sobre una palabra o frase concreta del versículo.
- Usa una imagen cotidiana y visual (oficio, casa, campo, mercado, ciudad) para explicar la verdad.
- Habla al lector de tú, con calidez y algo de urgencia, como un pastor que conoce a su gente.
- Frases cortas y con ritmo. Cero tecnicismos, cero griego o hebreo, cero citas de autores.
- Termina con una frase memorable que el lector pueda llevarse al día.
- Mantén una teología bautista evangélica conservadora, centrada en Cristo y en la gracia.

LÍMITES ESTRICTOS:
- Título: máximo 7 palabras.
- Versículo: máximo 35 palabras, textual con referencia exacta.
- Comentario (reflexion): entre 110 y 130 palabras.
- Gratitud: 1 pregunta disparadora, máximo 10 palabras.
- Oración: 1 motivo, máximo 10 palabras.
- Acción: 1 acción pequeña, concreta y realizable hoy, máximo 10 palabras.

FORMATO DE SALIDA:
Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta (sin markdown ni bloques \`\`\`json):
{
  "titulo": "Título de máx 7 palabras",
  "versiculo_referencia": "Referencia exacta (ej: Salmo 23:1 · RVR1960)",
  "versiculo_texto": "Texto bíblico textual",
  "texto_biblico": "«Texto bíblico textual» — Referencia",
  "reflexion": "Comentario de entre 110 y 130 palabras con estilo pastoral Spurgeon...",
  "cuerpo_texto": "Comentario de entre 110 y 130 palabras...",
  "gratitud_pregunta": "Pregunta disparadora de máx 10 palabras",
  "oracion": "Motivo de oración de máx 10 palabras",
  "frase_reflexion": "Motivo de oración de máx 10 palabras",
  "accion": "Acción pequeña y concreta de máx 10 palabras"
}

Transcripción del pastor:
"""
${transcription}
"""
`;

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
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
