// `grado` llega como objeto en /api/secciones y /api/docentes/me/grupos, pero
// como texto en las respuestas de /api/reportes.
// `ciclo` (año escolar) se agrega al final cuando viene, para distinguir la
// misma "1ro · Sección A" de un año y otro.
export const etiquetaSeccion = (s) => {
  const grado = typeof s.grado === 'string' ? s.grado : s.grado?.nombreGrado;
  const ciclo = s.ciclo ? ` · ${s.ciclo}` : '';
  return `${grado ?? ''} · Sección ${s.nombreSeccion}${ciclo}`;
};

export const fechaReporte = new Intl.DateTimeFormat('es-GT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
