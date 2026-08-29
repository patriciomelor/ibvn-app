# Integración n8n -> IBVN App (Devocionales IA)

Este documento explica cómo n8n debe conectarse con Supabase (el backend de IBVN App) para insertar los devocionales generados automáticamente a partir del audio semanal.

## 1. Lógica de Fechas (Corte los Domingos)

La app requiere un devocional diario. La IA debe procesar el audio y generar el contenido para todos los días desde **la fecha de procesamiento hasta el próximo Domingo**.

- Si se sube el audio un Domingo, se generan 7 días (Lunes a Domingo siguiente).
- Si se sube el audio un Miércoles, se generan 5 días (Miércoles a Domingo).

Por cada día generado, n8n debe realizar un `INSERT` en la tabla `devocionales` usando la fecha exacta en la que el usuario debe leerlo.

## 2. Configuración del Nodo Supabase / HTTP Request en n8n

Puedes usar el **Supabase Node** nativo de n8n, o un nodo de **HTTP Request**.

### Parámetros de Autenticación
- **URL / Endpoint**: `https://[TU_PROYECTO_SUPABASE].supabase.co/rest/v1/devocionales`
- **Method**: `POST`
- **Headers**:
  - `apikey`: `TU_SUPABASE_ANON_KEY` o `SERVICE_ROLE_KEY` (Recomendado service_role para escritura).
  - `Authorization`: `Bearer TU_SUPABASE_SERVICE_ROLE_KEY`
  - `Content-Type`: `application/json`
  - `Prefer`: `return=minimal` (opcional, para acelerar respuesta)

### 3. Payload JSON (Estructura de Datos)

Por cada devocional diario generado, n8n debe enviar un JSON con la siguiente estructura exacta:

```json
{
  "semana": 24,
  "fecha_asignada": "2026-08-30",
  "titulo": "El título generado por la IA",
  "texto_biblico": "Juan 3:16 (LBLA)",
  "reflexion": "Texto completo de la reflexión.\n\nPuedes usar saltos de línea (\\n) para separar párrafos. No usar Markdown (asteriscos, numerales, etc).",
  "aplicativo": "Texto sobre cómo aplicar esto a la vida diaria.",
  "preguntas": [
    "1. ¿Qué me enseña este pasaje?",
    "2. ¿Cómo puedo cambiar mi actitud hoy?",
    "3. ¿A quién debo perdonar?"
  ],
  "oracion": "Señor, ayúdame a aplicar esta enseñanza en mi vida...",
  "pdf_url": ""
}
```

### Detalles de los Campos:
- `semana` *(Integer)*: Número de semana del año (opcional para la UI, pero requerido por la DB).
- `fecha_asignada` *(Date / String "YYYY-MM-DD")*: **MUY IMPORTANTE**. Es la fecha exacta a la que corresponde este devocional. La app usará esto para cargar "el devocional de hoy".
- `titulo`, `texto_biblico`, `reflexion`, `aplicativo`, `oracion` *(Strings)*: Texto plano. Los saltos de línea se pueden enviar con `\n`.
- `preguntas` *(JSON Array)*: Arreglo de strings con las 3 preguntas aplicativas generadas.
- `pdf_url` *(String)*: (Opcional) Enviar string vacío o nulo si no hay PDF.

### 4. Flujo Recomendado en n8n
1. **Trigger**: Webhook o Catch Hook desde Drive/Telegram cuando llega un audio.
2. **Audio/Transcribe**: Convertir audio a texto (OpenAI Whisper).
3. **AI / LLM Node**: Prompt para extraer la información y crear el array de devocionales (desde hoy hasta el domingo). Pedir al LLM que devuelva un objeto JSON estructurado con un arreglo de devocionales.
4. **Item Lists / Split In Batches**: Dividir el arreglo de días.
5. **Supabase / HTTP Request**: Insertar fila por fila en la base de datos de IBVN.
