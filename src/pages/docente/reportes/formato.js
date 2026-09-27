export const etiquetaSeccion = (s) => `${s.grado?.nombreGrado ?? ''} · Sección ${s.nombreSeccion}`;

export const fechaReporte = new Intl.DateTimeFormat('es-GT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
