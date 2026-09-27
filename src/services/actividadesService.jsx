import apiClient from './apiClient';

export const MAX_PREGUNTAS = 10;

const error = (err, porDefecto) => {
  // El backend devuelve { message, errores: { campo: [..] } } en un 400 de Zod.
  const detalle = err.response?.data?.errores;
  const primero = detalle && Object.values(detalle).flat()[0];
  return { success: false, error: primero || err.response?.data?.message || porDefecto };
};

class ActividadesService {
  async listarModulos() {
    try {
      const response = await apiClient.get('/api/modulos');
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudieron cargar los módulos');
    }
  }

  async listarMisActividades() {
    try {
      const response = await apiClient.get('/api/docentes/me/actividades');
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudieron cargar las actividades');
    }
  }

  async obtener(id) {
    try {
      const response = await apiClient.get(`/api/actividades/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo cargar la actividad');
    }
  }

  async crear(actividad) {
    try {
      const response = await apiClient.post('/api/actividades', actividad);
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo crear la actividad');
    }
  }

  async actualizar(id, cambios) {
    try {
      const response = await apiClient.put(`/api/actividades/${id}`, cambios);
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo actualizar la actividad');
    }
  }

  async eliminar(id) {
    try {
      const response = await apiClient.delete(`/api/actividades/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo desactivar la actividad');
    }
  }
}

export default new ActividadesService();
