/**
 * Script para insertar devocional semanal en Supabase (Formato Libro de Bolsillo A6, 7 días)
 * 
 * Uso:
 *   node scripts/insertar-devocional.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno locales (.env.local o .env)
function loadEnv() {
  const envPaths = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...vals] = trimmed.split('=');
          if (key && vals.length > 0) {
            const val = vals.join('=').replace(/^["']|["']$/g, '');
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = val.trim();
            }
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Preferir SUPABASE_SERVICE_ROLE_KEY si existe en .env, sino usar VITE_SUPABASE_ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 7 días del Devocional Semanal IBVN · 06-09-2026 (Semana 37)
const devocionales = [
  {
    semana: 37,
    fecha_asignada: '2026-09-07',
    dia_nombre: 'Lunes',
    dia_numero: 1,
    titulo: 'Palabra fiel, llamado verdadero',
    texto_biblico: '«Palabra fiel es esta: si alguno aspira al cargo de obispo, buena obra desea hacer.» — 1 Timoteo 3:1 · LBLA',
    reflexion: 'Fíjate en la primera palabra: «fiel». Pablo no abre con una opinión; abre con un sello. Como el comerciante que pone su firma al pie de la balanza, el apóstol dice: lo que sigue es digno de confianza. Y luego aparecen dos verbos: aspirar y desear. Uno se ve por fuera, el esfuerzo; el otro arde por dentro, la pasión. Cuando Dios llama, planta ese fuego en el corazón. Nadie se hace pastor como quien elige un empleo. Es un llamado, no una meta personal. Y fíjate: el texto dice «buena obra», no «buen puesto». Si ves a alguien servir a la iglesia, no admires el cargo; mira la obra. Todo lo que viene esta semana descansa sobre una palabra fiel.',
    gratitud_pregunta: '¿Qué hombre de Dios ha marcado tu vida?',
    oracion: 'Señor, aviva en mí amor por tu obra.',
    accion: 'Lee 1 Timoteo 3:1-7 completo en voz alta.',
    sermon_titulo: 'Devocional semanal IBVN · 06-09-2026',
    sermon_predicador: 'Pastor IBVN',
    sermon_fecha: '2026-09-06',
    sermon_texto_base: '1 Timoteo 3:1-7',
    sermon_version: 'LBLA',
    published_at: new Date().toISOString()
  },
  {
    semana: 37,
    fecha_asignada: '2026-09-08',
    dia_nombre: 'Martes',
    dia_numero: 2,
    titulo: 'Un pastor trabaja toda la semana',
    texto_biblico: '«Pero os rogamos, hermanos, que reconozcáis a los que con diligencia trabajan entre vosotros, y os dirigen en el Señor y os instruyen.» — 1 Tesalonicenses 5:12 · LBLA',
    reflexion: 'Mira los verbos que Pablo usa: «trabajan», «dirigen», «instruyen». Ninguno dice «descansan el lunes». Hubo un campesino en un pueblo chico, Juanano. Cada mañana abría el cerco y sacaba sus ovejas a pastar. Cada tarde las llamaba, y ellas reconocían su voz. Sabía dónde había buen pasto, cuándo debían beber, cuándo estaban enfermas. Así es el pastor: no solo habla el domingo; guía, alimenta, corrige y cuida toda la semana. Ese hombre del cerco no entretenía a sus ovejas; las mantenía vivas. Dirige, predica, enseña, protege. Su meta es edificarte con la Palabra. Hoy piensa en quienes te pastorean. ¿Los conoces? ¿Te conocen? Reconócelos, dice Pablo. Un pastor que trabaja toda la semana merece tu oración.',
    gratitud_pregunta: '¿Quién te ha aconsejado con la Palabra?',
    oracion: 'Padre, sostén a mis pastores en su trabajo.',
    accion: 'Envía un mensaje de ánimo a un pastor.',
    sermon_titulo: 'Devocional semanal IBVN · 06-09-2026',
    sermon_predicador: 'Pastor IBVN',
    sermon_fecha: '2026-09-06',
    sermon_texto_base: '1 Timoteo 3:1-7',
    sermon_version: 'LBLA',
    published_at: new Date().toISOString()
  },
  {
    semana: 37,
    fecha_asignada: '2026-09-09',
    dia_nombre: 'Miércoles',
    dia_numero: 3,
    titulo: 'Pastores sanos, iglesia sana',
    texto_biblico: '«Acordaos de vuestros guías que os hablaron la palabra de Dios, y considerando el resultado de su conducta, imitad su fe.» — Hebreos 13:7 · LBLA',
    reflexion: '«Imitad su fe.» Pero antes dice: considerad «el resultado de su conducta». Es decir, mira el fruto antes de imitar. Un carpintero se conoce por la mesa que entrega, no por el plano que muestra. Así Dios te invita a mirar a quienes te guían: ¿qué fruto dejan? Pastores sanos, iglesia sana. Pero cuidado: el pastor no existe para que hagas su voluntad, sino la de Dios. Su trabajo es mostrarte el camino con la Palabra, no con su opinión. Y tú puedes medir su vida con ese mismo estándar, con humildad y con la Biblia abierta. No sigas a nadie que no apunte a Jesús. Sigue a quien te lleva a Él.',
    gratitud_pregunta: '¿Qué fruto en tus guías te anima?',
    oracion: 'Señor, que mis guías me señalen siempre a Cristo.',
    accion: 'Anota una enseñanza que recibiste de tus guías.',
    sermon_titulo: 'Devocional semanal IBVN · 06-09-2026',
    sermon_predicador: 'Pastor IBVN',
    sermon_fecha: '2026-09-06',
    sermon_texto_base: '1 Timoteo 3:1-7',
    sermon_version: 'LBLA',
    published_at: new Date().toISOString()
  },
  {
    semana: 37,
    fecha_asignada: '2026-09-10',
    dia_nombre: 'Jueves',
    dia_numero: 4,
    titulo: 'El estándar lo puso Dios',
    texto_biblico: '«Un obispo debe ser, pues, irreprochable, marido de una sola mujer, sobrio, prudente, de conducta decorosa, hospitalario, apto para enseñar.» — 1 Timoteo 3:2 · LBLA',
    reflexion: '¿Quién escribió esta lista? No un concilio de pastores ni un grupo de apóstoles con ganas de complicar la vida ajena. La escribió Dios. Mira la primera palabra: «irreprochable». Es decir, sin por dónde agarrarlo. Como una pared bien levantada: no hay grieta donde meter un dedo. Luego vienen fidelidad al cónyuge, dominio propio, claridad mental, orden, prioridades claras, puertas abiertas al extraño y capacidad de enseñar con la Biblia. Son carácter, no talento. Y fíjate: el que enseña la Palabra debe vivir bajo ella. Esta lista no es para que critiques. Es para que ores. Y también para que tú, hijo de Dios, la pongas en tu propia lista y digas: eso quiero. Un carácter limpio es el mejor sermón.',
    gratitud_pregunta: '¿Qué carácter agradeces en tus pastores?',
    oracion: 'Señor, guarda la pureza y claridad de mis pastores.',
    accion: 'Elige una cualidad de la lista y practícala hoy.',
    sermon_titulo: 'Devocional semanal IBVN · 06-09-2026',
    sermon_predicador: 'Pastor IBVN',
    sermon_fecha: '2026-09-06',
    sermon_texto_base: '1 Timoteo 3:1-7',
    sermon_version: 'LBLA',
    published_at: new Date().toISOString()
  },
  {
    semana: 37,
    fecha_asignada: '2026-09-11',
    dia_nombre: 'Viernes',
    dia_numero: 5,
    titulo: 'Primero en casa, luego en la iglesia',
    texto_biblico: '«Que gobierne bien su casa y tenga a sus hijos sujetos con toda dignidad; pues si un hombre no sabe cómo gobernar su propia casa, ¿cómo cuidará de la iglesia de Dios?» — 1 Timoteo 3:4-5 · LBLA',
    reflexion: 'Dios examina al pastor primero en casa. ¿Por qué? Porque la casa es el taller donde se ve el trabajo real. Nadie confiaría una obra grande a un albañil cuya propia vivienda se cae. Gobernar bien no significa que se haga la voluntad del pastor, sino la de Dios. Y la lista sigue: no amigo del dinero, no violento ni amigo de peleas, no recién convertido, y con buen testimonio ante los vecinos, la escuela y la calle. Los de afuera también miran. Para ellos tu vida es la primera página que leen. Aplica lo mismo a ti: tu casa, tu bolsillo, tu trato con los vecinos. ¿Qué dicen de tu fe? Lo que no funciona en casa no convence afuera.',
    gratitud_pregunta: '¿Qué bendición hay en tu hogar hoy?',
    oracion: 'Señor, que mi casa refleje tu voluntad.',
    accion: 'Saluda hoy a un vecino con amabilidad.',
    sermon_titulo: 'Devocional semanal IBVN · 06-09-2026',
    sermon_predicador: 'Pastor IBVN',
    sermon_fecha: '2026-09-06',
    sermon_texto_base: '1 Timoteo 3:1-7',
    sermon_version: 'LBLA',
    published_at: new Date().toISOString()
  },
  {
    semana: 37,
    fecha_asignada: '2026-09-12',
    dia_nombre: 'Sábado',
    dia_numero: 6,
    titulo: 'Ovejas que costaron sangre',
    texto_biblico: '«Tened cuidado de vosotros y de toda la grey, en medio de la cual el Espíritu Santo os ha hecho obispos para pastorear la iglesia de Dios, la cual Él compró con su propia sangre.» — Hechos 20:28 · LBLA',
    reflexion: '«La cual él compró con su propia sangre.» Detente un instante en ese precio. Nadie paga tanto por algo barato. Las ovejas que hoy ves en la iglesia le costaron la vida al Señor. Por eso el estándar es tan alto: hay matrimonios rotos, hijos distanciados, hermanos que se apartan, almas cansadas, gente que no tiene esperanza. Al herido no se le atiende con manos torpes. Se le atiende con la Palabra, dicha por quien la vive. Ahora lo íntimo: ¿cómo escuchas tú? Cada domingo recibes alimento. ¿Lo retienes o lo dejas enfriar? Relee tus apuntes. Conversa del mensaje con alguien de tu casa. Lo que costó sangre merece toda tu atención.',
    gratitud_pregunta: '¿Qué enseñanza del domingo te ha alimentado?',
    oracion: 'Señor, consuela a los heridos de tu rebaño.',
    accion: 'Relee tus apuntes del sermón y coméntalos.',
    sermon_titulo: 'Devocional semanal IBVN · 06-09-2026',
    sermon_predicador: 'Pastor IBVN',
    sermon_fecha: '2026-09-06',
    sermon_texto_base: '1 Timoteo 3:1-7',
    sermon_version: 'LBLA',
    published_at: new Date().toISOString()
  },
  {
    semana: 37,
    fecha_asignada: '2026-09-13',
    dia_nombre: 'Domingo',
    dia_numero: 7,
    titulo: 'Cristo, Príncipe de los pastores',
    texto_biblico: '«Y cuando aparezca el Príncipe de los pastores, recibiréis la corona inmarcesible de gloria.» — 1 Pedro 5:4 · LBLA',
    reflexion: 'Toda la semana hablamos de pastores. Hoy mira por encima de ellos. «Príncipe de los pastores»: el título dice que hay uno sobre todos. Piensa en el dueño de un rebaño que contrata ayudantes. Los ayudantes cuidan, pero las ovejas no son suyas. Estas son de Cristo. Él pagó con su vida, hecho obediente hasta la muerte de cruz. Él es la cabeza, el único juez, el único gobernador. Los pastores le rinden cuentas; él conoce mente, corazón y obras. A él se debe toda gloria, honor y obediencia. Llega hoy al culto con los ojos en Cristo. Prepara tu corazón: hoy el Pastor te reúne con los suyos. Los pastores te sirven; Cristo te compró.',
    gratitud_pregunta: '¿Qué agradeces del Buen Pastor que te compró?',
    oracion: 'Señor, a ti sea toda la gloria hoy.',
    accion: 'Llega al culto con tu Biblia y expectante.',
    sermon_titulo: 'Devocional semanal IBVN · 06-09-2026',
    sermon_predicador: 'Pastor IBVN',
    sermon_fecha: '2026-09-06',
    sermon_texto_base: '1 Timoteo 3:1-7',
    sermon_version: 'LBLA',
    published_at: new Date().toISOString()
  }
];

async function insertDevotionals() {
  console.log(`📡 Conectando a Supabase en ${supabaseUrl}...`);
  console.log(`📦 Insertando ${devocionales.length} devocionales para la semana 37 (07-09-2026 al 13-09-2026)...`);

  const { data, error } = await supabase
    .from('devocionales')
    .insert(devocionales)
    .select('id, semana, dia_nombre, dia_numero, fecha_asignada, titulo');

  if (error) {
    console.error('\n❌ Error al insertar devocionales en Supabase:', error.message);
    
    if (error.message.includes('Could not find the') || error.code === 'PGRST204') {
      console.warn('\n⚠️ Causa detectada: Faltan columnas en la tabla "devocionales" (Migración MVP 12 pendiente).');
      console.warn('Debes aplicar la migración MVP 12 en el SQL Editor de Supabase:');
      console.warn('👉 database/supabase_migration_mvp12_devocional_bolsillo.sql');
      console.warn('O bien, ejecutar el script completo que incluye la migración e inserción:');
      console.warn('👉 database/insert_devocional_2026_09_06.sql');
    } else if (error.code === '42501' || error.message.includes('row-level security')) {
      console.warn('\n⚠️ Causa detectada: Bloqueado por Row-Level Security (RLS).');
      console.warn('Debes configurar SUPABASE_SERVICE_ROLE_KEY en tu archivo .env o ejecutar el SQL directamente en Supabase.');
    }
    process.exit(1);
  }

  console.log('\n✅ ¡7 devocionales insertados con éxito!');
  console.table(data);
}

insertDevotionals();
