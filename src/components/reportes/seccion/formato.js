// `grado` llega como objeto en /api/secciones y /api/docentes/me/grupos, pero
// como texto en las respuestas de /api/reportes.
export const etiquetaSeccion = (s) => {
  const grado = typeof s.grado === 'string' ? s.grado : s.grado?.nombreGrado;
  return `${grado ?? ''} · Sección ${s.nombreSeccion}`;
};

export const fechaReporte = new Intl.DateTimeFormat('es-GT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
