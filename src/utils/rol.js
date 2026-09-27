// El backend devuelve `rol` como string ("docente") en toda la API. Hasta el
// 2026-09-27 los endpoints de /api/usuarios lo devolvían como
// { id, nombreRol }; se aceptan ambos para que el orden de deploy entre
// frontend y backend no importe.
export const nombreRol = (rol) => (typeof rol === 'string' ? rol : rol?.nombreRol);
