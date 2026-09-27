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
        params: idGrado ? { idGrado } : {},
      });
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'No se pudieron cargar las secciones',
      };
    }
  }

  // Grados que tienen secciones, derivados de /api/secciones. Sirve a admin y
  // docente por igual (el docente no puede leer /api/grados).
  async listarGradosConSecciones() {
    const result = await this.listarSecciones();
    if (!result.success) return result;
    const grados = new Map(result.data.filter((s) => s.grado).map((s) => [s.grado.id, s.grado]));
    return { success: true, data: [...grados.values()].sort((a, b) => a.id - b.id) };
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
