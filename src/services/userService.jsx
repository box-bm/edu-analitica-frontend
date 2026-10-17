import apiClient, { refrescarSesion } from './apiClient';

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
        // 401 → credenciales; 429 → límite de intentos. El backend manda el
        // texto en `message`. Sin respuesta es un problema de red.
        error: err.response
          ? err.response.data?.message || 'Credenciales inválidas'
          : 'No se pudo conectar con el servidor. Intenta de nuevo.',
      };
    }
  }

  async refresh() {
    try {
      // Mismo refresh single-flight que usa el interceptor de apiClient.
      const accessToken = await refrescarSesion();
      return {
        success: true,
        data: { accessToken },
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
