import apiClient from './apiClient';

const error = (err, porDefecto) => {
  const detalle = err.response?.data?.errores;
  const primero = detalle && Object.values(detalle).flat()[0];
  return { success: false, error: primero || err.response?.data?.message || porDefecto };
};

class UsuariosService {
  async listar() {
    try {
      const response = await apiClient.get('/api/usuarios');
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudieron cargar los usuarios');
    }
  }

  async crear({ nombreCompleto, usuario, password, rol }) {
    try {
      const response = await apiClient.post('/api/usuarios', { nombreCompleto, usuario, password, rol });
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo crear el usuario');
    }
  }

  // Solo se envían los campos presentes: una contraseña vacía no la cambia.
  async actualizar(id, cambios) {
    try {
      const response = await apiClient.put(`/api/usuarios/${id}`, cambios);
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo actualizar el usuario');
    }
  }
}

export default new UsuariosService();
