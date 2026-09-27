// Qué puede hacer cada rol con los reportes del Módulo 4. Es solo UX (qué se
// muestra): el backend revalida el rol en cada endpoint.
//
// Para habilitar otro rol, agrégalo aquí A MANO y también en el backend
// (roleMiddleware en src/modules/reportes/reportes.routes.ts); un rol que no
// esté en esta tabla no ve ni registra nada.
//
// - ver: vista previa, exportar CSV e historial.
// - registrar: guardar el link del PDF generado en Colab.
// - secciones: 'propias' = solo donde el rol tiene grupos (docente);
//              'todas' = todas las secciones activas (admin).
export const PERMISOS_REPORTES = {
  administrador: { ver: true, registrar: false, secciones: 'todas' },
  docente: { ver: true, registrar: true, secciones: 'propias' },
};

const SIN_PERMISOS = { ver: false, registrar: false, secciones: 'propias' };

export const permisosReportes = (rol) => PERMISOS_REPORTES[rol] ?? SIN_PERMISOS;
