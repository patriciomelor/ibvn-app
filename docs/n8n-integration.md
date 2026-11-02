# Integración n8n -> IBVN App (Devocional Semanal en Formato de Bolsillo)

Este documento detalla la integración de **n8n** con **Supabase** para el nuevo formato de **Devocional Semanal IBVN** (formato libro de bolsillo A6, 7 días de lunes a domingo, estilo Spurgeon).

---

## 0. Arquitectura de Carga vía Supabase Storage (.md)

En este flujo:
1. **n8n** procesa la transcripción del sermón dominical con el modelo de IA.
2. La IA genera el devocional completo en formato Markdown (`.md`).
3. **n8n** sube el archivo `.md` a Supabase Storage en el bucket **`devocionales_md`** (ej: `devocional_2026-09-06.md`).
4. **La App (Panel Pastoral)** verifica periódicamente (cada 45 segundos o con el botón manual) si hay archivos nuevos en Storage.
5. El pastor previsualiza el archivo, **modifica o corrige cualquier texto directamente** y lo importa a la base de datos con un clic.

### Subida del archivo .md a Supabase Storage desde n8n
- **Método**: `POST`
- **URL**: `https://[TU_PROYECTO_SUPABASE].supabase.co/storage/v1/object/devocionales_md/devocional_{{ $json.sermon_fecha }}.md`
- **Headers**:
  - `apikey`: `TU_SUPABASE_SERVICE_ROLE_KEY`
  - `Authorization`: `Bearer TU_SUPABASE_SERVICE_ROLE_KEY`
  - `Content-Type`: `text/markdown; charset=utf-8`
  - `x-upsert`: `true`
- **Body**: Texto en Markdown generado por el nodo LLM.

---

## 1. El Prompt de IA en n8n

El prompt implementado en el nodo de Inteligencia Artificial (OpenAI, Claude, etc.) en n8n toma los datos del sermón dominical y su transcripción para generar los 7 devocionales diarios:

```text
# Prompt · Devocional semanal IBVN

Copia todo lo que está bajo la línea, completa los corchetes y pega la transcripción al final.

---

Eres un redactor pastoral de la Iglesia Bautista Vida Nueva (IBVN). Tu tarea es convertir la transcripción de un sermón dominical en *7 devocionales diarios (lunes a domingo)* que se publicarán en formato de libro de bolsillo (A6, una página por día).

## Datos del sermón
•  Título: [TÍTULO]
•  Predicador: [NOMBRE]
•  Fecha: [FECHA - YYYY-MM-DD]
•  Texto base: [REFERENCIA]
•  Versión bíblica: [RVR1960 u otra]

## Cómo leer el sermón
1. Lee la transcripción completa. Ignora saludos, anuncios, chistes de calentamiento, muletillas y errores de transcripción.
2. Identifica la idea central y divídela en *7 puntos que avancen en secuencia*, como capítulos: el lunes abre, el sábado aplica más profundo, el domingo resume la semana y prepara el corazón para el culto.
3. Cada día desarrolla *un solo punto*. No repitas ideas entre días.
4. Sé fiel al sermón: no agregues doctrina, anécdotas ni aplicaciones que contradigan o excedan lo predicado. Si el sermón no da material suficiente para 7 días, usa los textos bíblicos que el predicador citó, sin inventar otros temas.
5. Mantén una teología bautista evangélica conservadora, centrada en Cristo y en la gracia.

## Estilo del comentario (a la Spurgeon)
•  Abre con una observación aguda sobre una palabra o frase concreta del versículo.
•  Usa una imagen cotidiana y visual (oficio, casa, campo, mercado, ciudad) para explicar la verdad.
•  Habla al lector de tú, con calidez y algo de urgencia, como un pastor que conoce a su gente.
•  Frases cortas y con ritmo. Cero tecnicismos, cero griego o hebreo, cero citas de autores.
•  Termina con una frase memorable que el lector pueda llevarse al día.
•  Nunca imites frases textuales de Spurgeon: imita su tono, no su texto.

## Límites estrictos (el diseño no perdona)
•  Título del día: máximo 7 palabras.
•  Versículo: máximo 35 palabras, textual de la versión indicada, con referencia exacta. Debe provenir del sermón o de un texto citado en él.
•  Comentario: *entre 110 y 130 palabras*. Cuenta las palabras antes de entregar.
•  Gratitud: 1 pregunta disparadora, máximo 10 palabras.
•  Oración: 1 motivo, máximo 10 palabras.
•  Acción: 1 acción pequeña, concreta y realizable hoy, máximo 10 palabras.

## Formato de salida
Entrega los 7 días con exactamente esta estructura, sin texto antes ni después:

*[DÍA] · Día [N]*
Título:
Versículo: «...» — [Referencia · Versión]
Comentario:
Gratitud:
Oración:
Acción:

Al final, agrega una línea:  Revisión: [palabras del comentario por día, ej. L118 M124 ...] .

## Transcripción
[PEGAR AQUÍ LA TRANSCRIPCIÓN COMPLETA]
```

---

## 2. Nodo "Code (JavaScript)" en n8n para parsear el resultado

Coloca este nodo de tipo **Code** (Run Once for All Items o Run Once for Each Item) justo después del nodo LLM que genera el texto para transformarlo en 7 elementos JSON listos para insertar en Supabase:

```javascript
// Input esperado: $input.first().json.output o $input.first().json.text
const rawText = $input.first().json.output || $input.first().json.text || '';

// Datos del sermón enviados por la App al Webhook (n8n los anida bajo `body`)
const hook = $('Webhook').first().json.body || $('Webhook').first().json;
const sermonMetadata = {
  sermon_titulo: hook.sermon_titulo || 'Sermón Dominical',
  sermon_predicador: hook.sermon_predicador || 'Pastor IBVN',
  sermon_fecha: hook.sermon_fecha || new Date().toISOString().split('T')[0],
  sermon_texto_base: hook.sermon_texto_base || '',
  sermon_version: hook.sermon_version || 'LBLA'
};

// Calcular semana del año
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Calcular la fecha del lunes de la semana correspondiente
const baseDate = new Date(sermonMetadata.sermon_fecha + 'T12:00:00Z');
// El sermón dominical da origen a la semana siguiente (lunes a domingo)
// Si el sermón fue domingo (day 0), el día 1 (lunes) es al día siguiente (+1 día)
const dayOfWeek = baseDate.getUTCDay();
const daysUntilMonday = dayOfWeek === 0 ? 1 : ((8 - dayOfWeek) % 7);
const mondayDate = new Date(baseDate);
mondayDate.setUTCDate(baseDate.getUTCDate() + daysUntilMonday);

const semanaNum = getWeekNumber(mondayDate);

// Expresión regular para capturar cada bloque diario: *[DÍA] · Día [N]*
const daysRegex = /\*\[?([A-ZÁÉÍÓÚÑ]+)\]?\s*·\s*Día\s*([1-7])\*\s*([\s\S]*?)(?=\*\[?[A-ZÁÉÍÓÚÑ]+\]?\s*·\s*Día|\s*Revisión:|$)/gi;

const results = [];
let match;

while ((match = daysRegex.exec(rawText)) !== null) {
  const diaNombre = match[1].trim();
  const diaNumero = parseInt(match[2], 10);
  const block = match[3].trim();

  // Extraer campos del bloque
  const tituloMatch = block.match(/Título:\s*(.+)/i);
  const versiculoMatch = block.match(/Versículo:\s*(.+)/i);
  const comentarioMatch = block.match(/Comentario:\s*([\s\S]*?)(?=\nGratitud:|$)/i);
  const gratitudMatch = block.match(/Gratitud:\s*(.+)/i);
  const oracionMatch = block.match(/Oración:\s*(.+)/i);
  const accionMatch = block.match(/Acción:\s*(.+)/i);

  // Calcular la fecha asignada a este día específico (Lunes = +0, Martes = +1, ..., Domingo = +6)
  const fechaDia = new Date(mondayDate);
  fechaDia.setUTCDate(mondayDate.getUTCDate() + (diaNumero - 1));
  const fechaAsignadaStr = fechaDia.toISOString().split('T')[0];

  results.push({
    json: {
      semana: semanaNum,
      fecha_asignada: fechaAsignadaStr,
      dia_nombre: diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1).toLowerCase(),
      dia_numero: diaNumero,
      titulo: tituloMatch ? tituloMatch[1].trim() : `Día ${diaNumero}`,
      texto_biblico: versiculoMatch ? versiculoMatch[1].trim() : '',
      reflexion: comentarioMatch ? comentarioMatch[1].trim() : '',
      gratitud_pregunta: gratitudMatch ? gratitudMatch[1].trim() : '',
      oracion: oracionMatch ? oracionMatch[1].trim() : '',
      accion: accionMatch ? accionMatch[1].trim() : '',
      sermon_titulo: sermonMetadata.sermon_titulo,
      sermon_predicador: sermonMetadata.sermon_predicador,
      sermon_fecha: sermonMetadata.sermon_fecha,
      sermon_texto_base: sermonMetadata.sermon_texto_base,
      sermon_version: sermonMetadata.sermon_version,
      published_at: new Date().toISOString()
    }
  });
}

return results;
```

---

## 3. Nodo Supabase / HTTP Request en n8n

Conecta la salida del nodo Code directamente a un nodo **Supabase** (acción: *Insert row*) o nodo **HTTP Request**:

- **Método**: `POST`
- **URL**: `https://[TU_PROYECTO_SUPABASE].supabase.co/rest/v1/devocionales`
- **Headers**:
  - `apikey`: `TU_SUPABASE_SERVICE_ROLE_KEY`
  - `Authorization`: `Bearer TU_SUPABASE_SERVICE_ROLE_KEY`
  - `Content-Type`: `application/json`
  - `Prefer`: `resolution=merge-duplicates`
- **Body / Payload (JSON)**:
```json
{
  "semana": {{ $json.semana }},
  "fecha_asignada": "{{ $json.fecha_asignada }}",
  "dia_nombre": "{{ $json.dia_nombre }}",
  "dia_numero": {{ $json.dia_numero }},
  "titulo": "{{ $json.titulo }}",
  "texto_biblico": "{{ $json.texto_biblico }}",
  "reflexion": "{{ $json.reflexion }}",
  "gratitud_pregunta": "{{ $json.gratitud_pregunta }}",
  "oracion": "{{ $json.oracion }}",
  "accion": "{{ $json.accion }}",
  "sermon_titulo": "{{ $json.sermon_titulo }}",
  "sermon_predicador": "{{ $json.sermon_predicador }}",
  "sermon_fecha": "{{ $json.sermon_fecha }}",
  "sermon_texto_base": "{{ $json.sermon_texto_base }}",
  "sermon_version": "{{ $json.sermon_version }}"
}
```

---

## 4. Estructura de la Base de Datos en Supabase (Migración MVP 12)

Asegúrate de ejecutar la migración SQL `database/supabase_migration_mvp12_devocional_bolsillo.sql` en tu proyecto de Supabase.

Esta migración añade:
- Columnas en `devocionales`:
  - `dia_nombre` (TEXT)
  - `dia_numero` (INTEGER)
  - `gratitud_pregunta` (TEXT)
  - `accion` (TEXT)
  - `sermon_titulo` (TEXT)
  - `sermon_predicador` (TEXT)
  - `sermon_fecha` (DATE)
  - `sermon_texto_base` (TEXT)
  - `sermon_version` (TEXT)
- Columnas en `devotional_journal`:
  - `gratitud_1` (TEXT)
  - `gratitud_2` (TEXT)
  - `gratitud_3` (TEXT)
  - `accion_completada` (BOOLEAN)
- RPC `completar_devocional`:
  - Acepta tanto los parámetros antiguos como los nuevos, manteniendo las rachas y gamificación sin interrupción.
