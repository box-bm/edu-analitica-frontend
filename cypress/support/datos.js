// Preparación de datos por API para los specs E2E.
//
// Todo lo que crean los tests lleva el prefijo E2E y se desactiva al final
// del spec (el backend hace soft delete: las filas quedan inactivas). Los
// reportes registrados en Módulo 4 no se pueden borrar: quedan asociados a
// una sección E2E inactiva.

// URL absoluta del backend, para cy.intercept.
export const rutaApi = (ruta) => `${Cypress.expose('apiUrl')}${ruta}`;

// Sufijo corto y aleatorio (mayúsculas y dígitos).
export const uid = (largo = 4) =>
  Math.random()
    .toString(36)
    .slice(2, 2 + largo)
    .toUpperCase()
    .padEnd(largo, '0');

// Un grado con al menos dos módulos: `matematica` (el primero, con
// actividades del catálogo base) y `computacion` (otro módulo del mismo
// grado, para los casos sin resultados). Prefiere los nombres del seed.
export function modulosDeUnGrado(token) {
  return cy.api(token, 'GET', '/api/modulos').then(({ body: modulos }) => {
    const porGrado = new Map();
    for (const m of [...modulos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))) {
      if (!porGrado.has(m.idGrado)) porGrado.set(m.idGrado, []);
      porGrado.get(m.idGrado).push(m);
    }
    const candidatos = [...porGrado.entries()].filter(([, ms]) => ms.length >= 2);
    const esMate = (m) => /matem/i.test(m.nombreModulo);
    const elegido = candidatos.find(([, ms]) => ms.some(esMate)) ?? candidatos[0];
    if (!elegido) {
      const resumen = modulos.map((m) => `${m.nombreModulo} (grado ${m.idGrado})`).join(', ') || 'ninguno';
      throw new Error(`Se necesita un grado con 2 módulos o más. Módulos en /api/modulos: ${resumen}`);
    }
    const [idGrado, ms] = elegido;
    const matematica = ms.find(esMate) ?? ms[0];
    const computacion = ms.find((m) => m !== matematica);
    return { idGrado, matematica, computacion };
  });
}

// Sección nueva (nombre máx. 5 caracteres) para aislar los datos del spec.
export function crearSeccion(tokenAdmin, idGrado) {
  return cy
    .api(tokenAdmin, 'POST', '/api/secciones', { idGrado, nombreSeccion: `E${uid(4)}` })
    .its('body');
}

export function crearGrupo(tokenDocente, idSeccion, nombre = `E2E Grupo ${uid()}`) {
  return cy.api(tokenDocente, 'POST', '/api/grupos', { idSeccion, nombreGrupo: nombre }).its('body');
}

export function entrarGrupo(codigo) {
  return cy.api(null, 'POST', '/api/auth/grupo-login', { codigo_acceso: codigo }).its('body.token');
}

// Primera actividad de un módulo, vista desde la sesión del grupo.
export function primeraActividad(tokenGrupo, idModulo) {
  return cy.api(tokenGrupo, 'GET', '/api/grupo/me/actividades').then(({ body: modulos }) => {
    const modulo = modulos.find((m) => m.id === idModulo);
    if (!modulo?.actividades.length) throw new Error(`El módulo ${idModulo} no tiene actividades para el grupo`);
    return modulo.actividades[0];
  });
}

// Respuestas correctas de una actividad (el docente sí las ve).
export function respuestasCorrectas(tokenDocente, idActividad) {
  return cy.api(tokenDocente, 'GET', `/api/actividades/${idActividad}`).then(({ body }) => {
    const porEnunciado = new Map(body.preguntas.map((p) => [p.enunciado, p]));
    return { actividad: body, porEnunciado };
  });
}

// Resuelve una actividad por API: las primeras `aciertos` preguntas bien, el resto mal.
export function resolverActividad({ tokenDocente, tokenGrupo, idActividad, aciertos }) {
  return respuestasCorrectas(tokenDocente, idActividad).then(({ actividad }) => {
    const respuestas = actividad.preguntas.map((p, i) => ({
      idPregunta: p.id,
      respuesta: i < aciertos ? p.respuestaCorrecta : p.opciones.find((o) => o !== p.respuestaCorrecta),
    }));
    return cy
      .api(tokenGrupo, 'POST', `/api/actividades/${idActividad}/respuestas`, { respuestas })
      .its('body');
  });
}

// Limpieza tolerante: si algo ya no existe, no rompe el spec.
export function desactivar(token, ruta) {
  return cy.api(token, 'DELETE', ruta, undefined, { failOnStatusCode: false, log: false });
}
