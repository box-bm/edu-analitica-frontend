// Tipos de pregunta que entiende el backend (preguntas.tipo). Una pregunta sin
// tipo es de selección múltiple: así se ven las actividades anteriores.
export const TIPOS = {
  MULTIPLE_CHOICE: {
    nombre: 'Selección múltiple',
    icono: '🔤',
    ayuda: 'Una pregunta con 2 a 4 respuestas de texto.',
    instruccion: 'Elige una respuesta',
  },
  IMAGE_CHOICE: {
    nombre: 'Selección con imágenes',
    icono: '🖼️',
    ayuda: 'Las respuestas son de 2 a 4 imágenes.',
    instruccion: 'Toca la imagen correcta',
  },
  ORDERING: {
    nombre: 'Ordenar elementos',
    icono: '🔢',
    ayuda: 'De 3 a 6 tarjetas que se arrastran hasta quedar en orden.',
    instruccion: 'Arrastra las tarjetas hasta ponerlas en orden',
  },
  MATCHING: {
    nombre: 'Relacionar elementos',
    icono: '🔗',
    ayuda: 'De 3 a 5 parejas que se unen con líneas.',
    instruccion: 'Toca un elemento de cada lado para unirlos',
  },
  CLASSIFICATION: {
    nombre: 'Clasificar elementos',
    icono: '🗂️',
    ayuda: 'De 3 a 8 tarjetas que se arrastran a 2 o 3 grupos.',
    instruccion: 'Arrastra cada tarjeta a su grupo',
  },
};

export const tipoDe = (pregunta) => (TIPOS[pregunta?.tipo] ? pregunta.tipo : 'MULTIPLE_CHOICE');

// ¿El grupo ya respondió esta pregunta lo suficiente como para seguir?
export function estaRespondida(pregunta, respuesta) {
  if (respuesta === undefined || respuesta === null) return false;
  switch (tipoDe(pregunta)) {
    case 'ORDERING':
      return Array.isArray(respuesta);
    case 'MATCHING':
      return respuesta.length === pregunta.configuracion.izquierda.length;
    case 'CLASSIFICATION':
      return respuesta.length === pregunta.configuracion.elementos.length;
    default:
      return respuesta !== '';
  }
}
