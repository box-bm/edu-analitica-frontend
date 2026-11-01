// Conversión entre el formulario del editor y la API de actividades, y las
// mismas reglas que valida el backend (actividades.schema.ts), para avisar
// antes de enviar. El backend vuelve a validar todo.

export const LIMITES = {
  MULTIPLE_CHOICE: { min: 2, max: 4 },
  IMAGE_CHOICE: { min: 2, max: 4 },
  ORDERING: { min: 3, max: 6 },
  MATCHING: { min: 3, max: 5 },
  CLASSIFICATION: { min: 3, max: 8, minCategorias: 2, maxCategorias: 3 },
};

// Cada pregunta del formulario guarda los campos de todos los tipos, así
// cambiar de tipo no borra lo que el docente ya escribió en otro.
export function preguntaVacia(tipo = 'MULTIPLE_CHOICE') {
  return {
    tipo,
    enunciado: '',
    puntos: 1,
    opciones: ['', ''],
    correcta: null,
    imagenes: [
      { imagen: null, texto: '' },
      { imagen: null, texto: '' },
    ],
    imagenCorrecta: null,
    elementos: ['', '', ''],
    pares: [
      { izquierda: '', derecha: '' },
      { izquierda: '', derecha: '' },
      { izquierda: '', derecha: '' },
    ],
    categorias: ['', ''],
    clasificables: [
      { texto: '', categoria: 0 },
      { texto: '', categoria: 1 },
      { texto: '', categoria: 0 },
    ],
  };
}

const limpio = (t) => t.trim();

export function aApi(preguntas) {
  return preguntas.map((p) => {
    const base = { tipo: p.tipo, enunciado: p.enunciado.trim(), puntos: Number(p.puntos) || 1 };
    switch (p.tipo) {
      case 'IMAGE_CHOICE':
        return {
          ...base,
          configuracion: {
            opciones: p.imagenes.map((o, i) => ({
              imagen: o.imagen ?? '',
              texto: o.texto.trim() || null,
              correcta: i === p.imagenCorrecta,
            })),
          },
        };
      case 'ORDERING':
        return { ...base, configuracion: { elementos: p.elementos.map((texto) => ({ texto: limpio(texto) })) } };
      case 'MATCHING':
        return {
          ...base,
          configuracion: {
            pares: p.pares.map((x) => ({ izquierda: limpio(x.izquierda), derecha: limpio(x.derecha) })),
          },
        };
      case 'CLASSIFICATION':
        return {
          ...base,
          configuracion: {
            categorias: p.categorias.map((nombre) => ({ nombre: limpio(nombre) })),
            elementos: p.clasificables.map((e) => ({ texto: limpio(e.texto), categoria: e.categoria })),
          },
        };
      default: {
        // El formulario guarda la correcta como índice; la API espera el texto.
        const opciones = p.opciones.map(limpio);
        return { ...base, opciones, respuestaCorrecta: p.correcta === null ? '' : opciones[p.correcta] };
      }
    }
  });
}

export function desdeApi(preguntas) {
  return preguntas.map((p) => {
    const vacia = preguntaVacia(p.tipo ?? 'MULTIPLE_CHOICE');
    const base = { ...vacia, enunciado: p.enunciado, puntos: p.puntos ?? 1 };
    const c = p.configuracion;
    switch (base.tipo) {
      case 'IMAGE_CHOICE':
        return {
          ...base,
          imagenes: c.opciones.map((o) => ({ imagen: o.imagen, texto: o.texto ?? '' })),
          imagenCorrecta: c.opciones.findIndex((o) => o.correcta),
        };
      case 'ORDERING':
        return { ...base, elementos: c.elementos.map((e) => e.texto) };
      case 'MATCHING':
        return { ...base, pares: c.pares.map((x) => ({ izquierda: x.izquierda.texto, derecha: x.derecha.texto })) };
      case 'CLASSIFICATION':
        return {
          ...base,
          categorias: c.categorias.map((x) => x.nombre),
          clasificables: c.elementos.map((e) => ({
            texto: e.texto,
            categoria: c.categorias.findIndex((x) => x.id === e.categoria),
          })),
        };
      default:
        return { ...base, opciones: [...p.opciones], correcta: p.opciones.indexOf(p.respuestaCorrecta) };
    }
  });
}

const repetidos = (textos) => new Set(textos.map((t) => t.trim())).size !== textos.length;
const vacios = (textos) => textos.some((t) => !t.trim());

function problemaDe(p) {
  if (!p.enunciado.trim()) return 'no tiene enunciado.';
  const puntos = Number(p.puntos);
  if (!Number.isInteger(puntos) || puntos < 1 || puntos > 10) return 'los puntos van de 1 a 10.';

  switch (p.tipo) {
    case 'IMAGE_CHOICE':
      if (p.imagenes.some((o) => !o.imagen)) return 'falta elegir alguna imagen.';
      if (repetidos(p.imagenes.map((o) => o.imagen))) return 'tiene imágenes repetidas.';
      if (p.imagenCorrecta === null || p.imagenCorrecta < 0) return 'marca la imagen correcta.';
      return null;
    case 'ORDERING':
      if (vacios(p.elementos)) return 'tiene elementos vacíos.';
      if (repetidos(p.elementos)) return 'tiene elementos repetidos.';
      return null;
    case 'MATCHING': {
      const izq = p.pares.map((x) => x.izquierda);
      const der = p.pares.map((x) => x.derecha);
      if (vacios(izq) || vacios(der)) return 'tiene parejas incompletas.';
      if (repetidos(izq) || repetidos(der)) return 'repite un elemento en una columna.';
      return null;
    }
    case 'CLASSIFICATION': {
      if (vacios(p.categorias)) return 'tiene grupos sin nombre.';
      if (repetidos(p.categorias)) return 'tiene grupos repetidos.';
      const textos = p.clasificables.map((e) => e.texto);
      if (vacios(textos)) return 'tiene tarjetas vacías.';
      if (repetidos(textos)) return 'tiene tarjetas repetidas.';
      return null;
    }
    default: {
      if (vacios(p.opciones)) return 'tiene opciones vacías.';
      if (repetidos(p.opciones)) return 'tiene opciones repetidas.';
      if (p.correcta === null || p.correcta < 0) return 'marca la respuesta correcta.';
      return null;
    }
  }
}

export function validar(form) {
  if (!form.idModulo) return 'Elige un módulo.';
  if (!form.titulo.trim()) return 'Escribe un título.';
  for (const [i, p] of form.preguntas.entries()) {
    const problema = problemaDe(p);
    if (problema) return `La pregunta ${i + 1} ${problema}`;
  }
  return null;
}
