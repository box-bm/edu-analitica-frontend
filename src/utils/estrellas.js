// 5 estrellas según el porcentaje del resultado, y siempre al menos 1: en la
// zona de niños no existe un resultado "en cero" ni con tono de fracaso (ver
// CLAUDE.md, UX constraints). Los niveles de los reportes del docente
// (alto ≥90 %, medio ≥60 %) son otra cosa y no dependen de esto.
export const TOTAL_ESTRELLAS = 5;

export function estrellasPorPorcentaje(porcentaje) {
  if (porcentaje >= 90) return 5;
  if (porcentaje >= 80) return 4;
  if (porcentaje >= 60) return 3;
  if (porcentaje >= 40) return 2;
  return 1;
}

export function estrellas(parte, total) {
  if (!total) return 1;
  return estrellasPorPorcentaje(Math.round((parte / total) * 100));
}

export const MENSAJES = {
  5: { titulo: '¡Increíble!', texto: 'Trabajaron en equipo como campeones.' },
  4: { titulo: '¡Excelente!', texto: 'Les faltó muy poquito. ¡Qué buen trabajo!' },
  3: { titulo: '¡Muy bien!', texto: 'Van por muy buen camino. ¡Sigan así!' },
  2: { titulo: '¡Buen trabajo!', texto: 'Ya aprendieron cosas nuevas. ¡Vamos por más!' },
  1: { titulo: '¡Buen intento!', texto: 'Cada práctica los hace más fuertes. ¿Lo intentan otra vez?' },
};

const COLORES_MODULO = ['orange', 'teal', 'grape', 'sky', 'leaf', 'sun'];

export function colorModulo(indice) {
  return COLORES_MODULO[indice % COLORES_MODULO.length];
}
