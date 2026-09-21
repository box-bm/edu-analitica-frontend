import apiClient from './apiClient';

class UserService {
  async login(credentials) {
    try {
      const response = await apiClient.post('/api/auth/login', {
        usuario: credentials.usuario,
        password: credentials.contraseña,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Credenciales inválidas',
      };
    }
  }

  async refresh() {
    try {
      const response = await apiClient.post('/api/auth/refresh');
      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Sesión expirada',
      };
    }
  }

  async logout() {
    try {
      await apiClient.post('/api/auth/logout');
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Error al cerrar sesión',
      };
    }
  }

  async me() {
    try {
      const response = await apiClient.get('/api/usuarios/me');
      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'No se pudo obtener el usuario',
      };
    }
  }
}

export default new UserService();
