import apiClient from './apiClient';

// 1ro antes que 2do; `orden` puede faltar en respuestas viejas.
export const porOrden = (a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id;

export const ciclosDe = (secciones) =>
  [...new Set(secciones.map((s) => s.ciclo).filter(Boolean))].sort((a, b) => b - a);

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

  async crearGrado({ nombreGrado, orden }) {
    try {
      const response = await apiClient.post('/api/grados', { nombreGrado, orden });
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'No se pudo crear el grado',
      };
    }
  }

  async actualizarGrado(id, { nombreGrado, orden, activo }) {
    try {
      const response = await apiClient.put(`/api/grados/${id}`, { nombreGrado, orden, activo });
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'No se pudo actualizar el grado',
      };
    }
  }

  async listarSecciones({ idGrado, ciclo } = {}) {
    try {
      const response = await apiClient.get('/api/secciones', {
        params: { ...(idGrado ? { idGrado } : {}), ...(ciclo ? { ciclo } : {}) },
      });
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'No se pudieron cargar las secciones',
      };
    }
  }

  // Grados y ciclos escolares que tienen secciones, derivados de
  // /api/secciones. Sirve a admin y docente por igual (el docente no puede
  // leer /api/grados). Ciclos del más reciente al más antiguo.
  async listarGradosConSecciones() {
    const result = await this.listarSecciones();
    if (!result.success) return result;
    const grados = new Map(result.data.filter((s) => s.grado).map((s) => [s.grado.id, s.grado]));
    return {
      success: true,
      data: { grados: [...grados.values()].sort(porOrden), ciclos: ciclosDe(result.data) },
    };
  }

  async crear({ idGrado, nombreSeccion, ciclo }) {
    try {
      const response = await apiClient.post('/api/secciones', { idGrado, nombreSeccion, ciclo });
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
