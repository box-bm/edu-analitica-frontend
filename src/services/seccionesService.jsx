import apiClient from './apiClient';

class SeccionesService {
  async listarGrados() {
    try {
      const response = await apiClient.get('/api/grados');
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'No se pudieron cargar los grados',
      };
    }
  }

  async listarSecciones(idGrado) {
    try {
      const response = await apiClient.get('/api/secciones', {
        params: idGrado ? { id_grado: idGrado } : {},
      });
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'No se pudieron cargar las secciones',
      };
    }
  }

  async crear({ idGrado, nombreSeccion }) {
    try {
      const response = await apiClient.post('/api/secciones', { idGrado, nombreSeccion });
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'No se pudo crear la sección',
      };
    }
  }

  async actualizar(id, { nombreSeccion, activa }) {
    try {
      const response = await apiClient.put(`/api/secciones/${id}`, { nombreSeccion, activa });
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'No se pudo actualizar la sección',
      };
    }
  }

  async eliminar(id) {
    try {
      const response = await apiClient.delete(`/api/secciones/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'No se pudo desactivar la sección',
      };
    }
  }
}

export default new SeccionesService();
