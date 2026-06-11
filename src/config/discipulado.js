// =========================================================================
// CONFIGURACIÓN DE DISCIPULADO Y CLASES - VIDA NUEVA APP
// =========================================================================

export const DISCIPULADO_CLASES = [
  {
    id: 'conectar',
    nombre: 'Clase 1: Conectar',
    descripcion: 'Fundamentos de la fe e introducción a la comunidad de Vida Nueva.',
    modulos: [
      { id: 'con_1', titulo: 'La visión de la iglesia', desc: 'Conoce nuestra historia, misión y valores.' },
      { id: 'con_2', titulo: 'La familia de la fe', desc: 'Qué significa ser miembro del cuerpo de Cristo.' },
      { id: 'con_3', titulo: 'Prácticas de comunión', desc: 'La importancia de las células y grupos pequeños.' },
      { id: 'con_4', titulo: 'Nuestro Pacto de Miembros', desc: 'Responsabilidades y bendiciones mutuas en la congregación.' }
    ]
  },
  {
    id: 'crecer',
    nombre: 'Clase 2: Crecer',
    descripcion: 'Hábitos diarios para madurar en el discipulado y carácter cristiano.',
    modulos: [
      { id: 'cre_1', titulo: 'El hábito de la Palabra', desc: 'Métodos para leer, estudiar y memorizar la Biblia.' },
      { id: 'cre_2', titulo: 'El hábito de la oración', desc: 'Desarrollando una vida de conversación constante con Dios.' },
      { id: 'cre_3', titulo: 'El hábito de la mayordomía', desc: 'Administración sabia de nuestro tiempo, talentos y finanzas.' },
      { id: 'cre_4', titulo: 'El hábito del servicio', desc: 'Compartir la gracia sirviendo en el amor a otros.' }
    ]
  },
  {
    id: 'intro_lid',
    nombre: 'Clase 3: Intro al Liderazgo',
    descripcion: 'Principios bíblicos para servir guiando e influyendo en otros.',
    modulos: [
      { id: 'lid_1', titulo: 'Corazón de siervo', desc: 'El modelo de liderazgo de Jesús: servir antes de mandar.' },
      { id: 'lid_2', titulo: 'Carácter del líder', desc: 'Estudio de los requisitos en las epístolas a Timoteo y Tito.' },
      { id: 'lid_3', titulo: 'Liderando células', desc: 'Estructura y dinámicas para guiar grupos pequeños sanos.' },
      { id: 'lid_4', titulo: 'Resolución de conflictos', desc: 'Tratar desavenencias según los principios de Mateo 18.' }
    ]
  },
  {
    id: 'dones',
    nombre: 'Clase 4: Descubre tus Dones',
    descripcion: 'Identificación de tus capacidades dadas por el Espíritu para la edificación común.',
    modulos: [
      { id: 'don_1', titulo: 'Fundamentos de Dones', desc: 'Estudio teológico de los dones espirituales en el Nuevo Testamento.' },
      { id: 'don_2', titulo: 'Test de Dones', desc: 'Identificar tus áreas primarias y secundarias de aptitudes.' },
      { id: 'don_3', titulo: 'Dones de Apoyo y Servicio', desc: 'Administración, dar, hospitalidad, misericordia.' },
      { id: 'don_4', titulo: 'Dones de Liderazgo y Palabra', desc: 'Enseñanza, profecía, fe, pastorado, exhortación.' }
    ]
  },
  {
    id: 'aplicadas',
    nombre: 'Clase 5: Herr. Aplicadas',
    descripcion: 'Herramientas y capacitación práctica para el ministerio en terreno.',
    modulos: [
      { id: 'apl_1', titulo: 'Cómo preparar un discipulado', desc: 'Hermenéutica básica y oratoria bíblica para células.' },
      { id: 'apl_2', titulo: 'Consejería espiritual', desc: 'Principios de escucha activa y contención bíblica.' },
      { id: 'apl_3', titulo: 'Evangelismo contemporáneo', desc: 'Tácticas para compartir tu testimonio en la cultura actual.' },
      { id: 'apl_4', titulo: 'Planes ministeriales', desc: 'Metodología de proyectos aplicados al ministerio local.' }
    ]
  }
]

export const REQUISITOS_LIDERAZGO = [
  { id: 'req_bautismo', label: 'Bautismo en Agua registrado' },
  { id: 'req_conectar', label: 'Aprobación del Ciclo Conectar' },
  { id: 'req_crecer', label: 'Aprobación del Ciclo Crecer' },
  { id: 'req_liderazgo', label: 'Asistencia completa a talleres de liderazgo' },
  { id: 'req_servicio', label: 'Servicio activo registrado en un ministerio (ej: Música, Misiones, Deporte)' },
  { id: 'req_pastoral', label: 'Recomendación formal del Equipo de Pastores' }
]
