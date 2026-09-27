import apiClient from './apiClient';

const error = (err, porDefecto) => ({
  success: false,
  error: err.response?.data?.message || porDefecto,
});

class GruposService {
  async listarMisGrupos() {
    try {
      const response = await apiClient.get('/api/docentes/me/grupos');
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudieron cargar los grupos');
    }
  }

  async listarSecciones() {
    try {
      const response = await apiClient.get('/api/secciones');
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudieron cargar las secciones');
    }
  }

  async crear({ idSeccion, nombreGrupo }) {
    try {
      const response = await apiClient.post('/api/grupos', { idSeccion, nombreGrupo });
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo crear el grupo');
    }
  }

  async regenerarCodigo(id) {
    try {
      const response = await apiClient.put(`/api/grupos/${id}/regenerar-codigo`);
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo regenerar el código');
    }
  }

  async eliminar(id) {
    try {
      const response = await apiClient.delete(`/api/grupos/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo desactivar el grupo');
    }
  }

  async resultados(idGrupo) {
    try {
      const response = await apiClient.get('/api/docentes/me/resultados', {
        params: idGrupo ? { idGrupo } : {},
      });
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudieron cargar los resultados');
    }
  }
}

export default new GruposService();
