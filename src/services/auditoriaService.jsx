import apiClient from './apiClient';

// Bitácora de seguridad (ISO 27001). Solo administrador; el backend responde
// 403 a cualquier otro rol y 400 { message: "Filtros invalidos" }.
export const ACCIONES_AUDITORIA = {
  login_exitoso: 'Inicio de sesión',
  login_fallido: 'Inicio de sesión fallido',
  logout: 'Cierre de sesión',
  refresh_reutilizado: 'Reuso de sesión (posible robo)',
  rate_limit_excedido: 'Límite de intentos excedido',
  grupo_login_exitoso: 'Grupo ingresó',
  grupo_login_fallido: 'Código de grupo fallido',
  usuario_creado: 'Usuario creado',
  usuario_actualizado: 'Usuario actualizado',
  usuario_desactivado: 'Usuario desactivado',
  grupo_creado: 'Grupo creado',
  grupo_codigo_regenerado: 'Código de grupo regenerado',
  grupo_desactivado: 'Grupo desactivado',
  grado_creado: 'Grado creado',
  grado_actualizado: 'Grado actualizado',
  seccion_creada: 'Sección creada',
  seccion_actualizada: 'Sección actualizada',
  seccion_desactivada: 'Sección desactivada',
  modulo_creado: 'Módulo creado',
  modulo_actualizado: 'Módulo actualizado',
  reporte_registrado: 'Reporte registrado',
};

// Posibles incidentes: se resaltan en la tabla.
export const ACCIONES_INCIDENTE = new Set(['refresh_reutilizado', 'rate_limit_excedido']);

class AuditoriaService {
  /**
   * @param {{accion?: string, idUsuario?: number, idGrupo?: number, desde?: string, hasta?: string, limite?: number, pagina?: number}} filtros
   *   `desde`/`hasta` en AAAA-MM-DD; `hasta` incluye todo ese día.
   */
  async listar(filtros = {}) {
    // Los vacíos no se mandan: el backend valida cada parámetro presente.
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    try {
      const response = await apiClient.get('/api/auditoria', { params });
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'No se pudo cargar la bitácora',
      };
    }
  }
}

export default new AuditoriaService();
