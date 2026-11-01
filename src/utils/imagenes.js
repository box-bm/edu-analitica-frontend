// Las preguntas guardan rutas, nunca URLs: "assets/..." son ilustraciones
// incluidas en este frontend (public/assets) e "imagenes/<uuid>" son las que
// sube un docente, servidas por el backend. Así una opción no puede apuntar a
// otro sitio (el backend también lo valida).
export function urlImagen(ruta) {
  if (!ruta) return null;
  if (ruta.startsWith('assets/')) return `${import.meta.env.BASE_URL}${ruta}`;
  if (/^imagenes\/[0-9a-f-]{36}$/.test(ruta)) return `${import.meta.env.VITE_API_URL}/api/${ruta}`;
  return null;
}

const MATE = 'assets/actividades/matematica';
const COMPU = 'assets/actividades/computacion';

// Ilustraciones incluidas en el sistema, para elegir sin subir nada.
export const CATALOGO_IMAGENES = [
  {
    grupo: 'Matemática',
    imagenes: [
      { ruta: `${MATE}/manzanas-3.svg`, nombre: '3 manzanas' },
      { ruta: `${MATE}/manzanas-5.svg`, nombre: '5 manzanas' },
      { ruta: `${MATE}/manzanas-7.svg`, nombre: '7 manzanas' },
      { ruta: `${MATE}/puntos-3x3.svg`, nombre: '3 filas de 3 puntos' },
      { ruta: `${MATE}/puntos-2x5.svg`, nombre: '2 filas de 5 puntos' },
      { ruta: `${MATE}/puntos-3x4.svg`, nombre: '3 filas de 4 puntos' },
    ],
  },
  {
    grupo: 'Computación',
    imagenes: [
      { ruta: `${COMPU}/monitor.svg`, nombre: 'Monitor' },
      { ruta: `${COMPU}/teclado.svg`, nombre: 'Teclado' },
      { ruta: `${COMPU}/mouse.svg`, nombre: 'Mouse' },
      { ruta: `${COMPU}/bocinas.svg`, nombre: 'Bocinas' },
      { ruta: `${COMPU}/impresora.svg`, nombre: 'Impresora' },
      { ruta: `${COMPU}/carpeta.svg`, nombre: 'Carpeta' },
      { ruta: `${COMPU}/documento.svg`, nombre: 'Documento' },
      { ruta: `${COMPU}/papelera.svg`, nombre: 'Papelera' },
    ],
  },
];
