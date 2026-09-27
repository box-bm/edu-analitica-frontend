// Siempre al menos 1 estrella: en la zona de niños no existe un resultado
// "en cero" ni con tono de fracaso (ver CLAUDE.md, UX constraints).
export function estrellas(puntaje, total) {
  if (!total) return 1;
  const proporcion = puntaje / total;
  if (proporcion >= 0.9) return 3;
  if (proporcion >= 0.6) return 2;
  return 1;
}

export const MENSAJES = {
  3: { titulo: '¡Increíble!', texto: 'Trabajaron en equipo como campeones.' },
  2: { titulo: '¡Muy bien!', texto: 'Van por muy buen camino. ¡Sigan así!' },
  1: { titulo: '¡Buen intento!', texto: 'Cada práctica los hace más fuertes. ¿Lo intentan otra vez?' },
};

const COLORES_MODULO = ['orange', 'teal', 'grape', 'sky', 'leaf', 'sun'];

export function colorModulo(indice) {
  return COLORES_MODULO[indice % COLORES_MODULO.length];
}
