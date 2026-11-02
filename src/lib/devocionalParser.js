/**
 * Utilidad para parsear el devocional semanal en formato libro de bolsillo (A6, 7 días)
 * generado por n8n / Inteligencia Artificial.
 */

export function getWeekNumber(d) {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}

/**
 * Parsea el texto completo en Markdown o texto plano del devocional semanal
 * @param {string} rawText - Texto del devocional semanal completo
 * @param {object} customMeta - Metadatos opcionales para sobreescribir o complementar
 * @returns {{ semana: number, sermonFecha: string, sermonTitulo: string, days: Array }}
 */
export function parseDevocionalSemanal(rawText = '', customMeta = {}) {
  if (!rawText || typeof rawText !== 'string') {
    return { semana: 1, sermonFecha: '', sermonTitulo: '', days: [] };
  }

  // 1. Extraer fecha del sermón del encabezado (ej. 06-09-2026, 06/09/2026 o 2026-09-06)
  const headerDateMatch = rawText.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
  let sermonFechaStr = '';
  if (headerDateMatch) {
    sermonFechaStr = `${headerDateMatch[3]}-${headerDateMatch[2]}-${headerDateMatch[1]}`;
  } else {
    const isoDateMatch = rawText.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (isoDateMatch) {
      sermonFechaStr = `${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}`;
    } else {
      sermonFechaStr = new Date().toISOString().split('T')[0];
    }
  }

  // 2. Extraer título general del devocional / sermón
  const headerTitleMatch = rawText.match(/^#\s*(.+)/m);
  const sermonTitulo = customMeta.sermon_titulo || (
    headerTitleMatch
      ? headerTitleMatch[1].replace(/·\s*\d{2}[-/]\d{2}[-/]\d{4}/, '').trim()
      : 'Devocional semanal IBVN'
  );

  // 3. Calcular la fecha del lunes correspondiente
  const sermonDate = new Date(`${sermonFechaStr}T12:00:00Z`);
  const dayOfWeek = isNaN(sermonDate.getTime()) ? 0 : sermonDate.getUTCDay(); // 0 is Sunday
  const daysUntilMonday = dayOfWeek === 0 ? 1 : ((8 - dayOfWeek) % 7);
  const mondayDate = new Date(sermonDate);
  if (!isNaN(sermonDate.getTime())) {
    mondayDate.setUTCDate(sermonDate.getUTCDate() + daysUntilMonday);
  }

  const semana = customMeta.semana || (isNaN(mondayDate.getTime()) ? 1 : getWeekNumber(mondayDate));

  // 4. Regex para capturar cada bloque diario:
  // Admite '## Lunes · Día 1', '*Lunes · Día 1*', '*[LUNES] · Día 1*', etc.
  const dayBlockRegex = /(?:##|\*\[?)\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s*·\s*Día\s*([1-7])\s*\*?\*?\s*([\s\S]*?)(?=(?:##|\*\[?)\s*[A-Za-zÁÉÍÓÚáéíóúñÑ]+\s*·\s*Día|\s*\*?Revisión:|$)/gi;

  const results = [];
  let match;

  while ((match = dayBlockRegex.exec(rawText)) !== null) {
    const diaNombreRaw = match[1].trim();
    const diaNumero = parseInt(match[2], 10);
    const block = match[3].trim();

    // Extraer campos tolerando asteriscos markdown (**Título:** o Título:)
    const tMatch = block.match(/(?:^|\n)\s*(?:\*{1,2})?Título(?:\*{1,2})?:(?:\*{1,2})?\s*(.+)/i);
    const vMatch = block.match(/(?:^|\n)\s*(?:\*{1,2})?Versículo(?:\*{1,2})?:(?:\*{1,2})?\s*(.+)/i);
    const cMatch = block.match(/(?:^|\n)\s*(?:\*{1,2})?Comentario(?:\*{1,2})?:(?:\*{1,2})?\s*([\s\S]*?)(?=(?:^|\n)\s*(?:\*{1,2})?Gratitud(?:\*{1,2})?:|$)/i);
    const gMatch = block.match(/(?:^|\n)\s*(?:\*{1,2})?Gratitud(?:\*{1,2})?:(?:\*{1,2})?\s*(.+)/i);
    const oMatch = block.match(/(?:^|\n)\s*(?:\*{1,2})?Oración(?:\*{1,2})?:(?:\*{1,2})?\s*(.+)/i);
    const aMatch = block.match(/(?:^|\n)\s*(?:\*{1,2})?Acción(?:\*{1,2})?:(?:\*{1,2})?\s*(.+)/i);

    const fechaDia = new Date(mondayDate);
    if (!isNaN(mondayDate.getTime())) {
      fechaDia.setUTCDate(mondayDate.getUTCDate() + (diaNumero - 1));
    }
    const fechaAsignadaStr = !isNaN(fechaDia.getTime())
      ? fechaDia.toISOString().split('T')[0]
      : '';

    const diaNombreNormalizado = diaNombreRaw.charAt(0).toUpperCase() + diaNombreRaw.slice(1).toLowerCase();

    results.push({
      semana,
      fecha_asignada: fechaAsignadaStr,
      dia_nombre: diaNombreNormalizado,
      dia_numero: diaNumero,
      titulo: tMatch ? tMatch[1].trim() : `Día ${diaNumero}`,
      texto_biblico: vMatch ? vMatch[1].trim() : '',
      reflexion: cMatch ? cMatch[1].trim() : '',
      gratitud_pregunta: gMatch ? gMatch[1].trim() : '',
      oracion: oMatch ? oMatch[1].trim() : '',
      accion: aMatch ? aMatch[1].trim() : '',
      sermon_titulo: sermonTitulo,
      sermon_predicador: customMeta.sermon_predicador || 'Pastor IBVN',
      sermon_fecha: sermonFechaStr,
      sermon_texto_base: customMeta.sermon_texto_base || '1 Timoteo 3:1-7',
      sermon_version: customMeta.sermon_version || 'LBLA',
      published_at: new Date().toISOString()
    });
  }

  return {
    semana,
    sermonFecha: sermonFechaStr,
    sermonTitulo,
    days: results
  };
}
