// const MOCK_USERS = [
//   {
//     Id: 1,
//     Nombre: 'Estudiante Demo',
//     Usuario: 'estudiante',
//     Contraseña: '1234',
//     Rol: 'Estudiante',
//   },
//   {
//     Id: 2,
//     Nombre: 'Docente Demo',
//     Usuario: 'docente',
//     Contraseña: '1234',
//     Rol: 'Docente',
//   },
//   {
//     Id: 3,
//     Nombre: 'Admin Demo',
//     Usuario: 'admin',
//     Contraseña: '1234',
//     Rol: 'Admin',
//   },
// ];

// class UserService {
//   async login(credentials) {
//     // Mock: simula una llamada al backend con una pequeña latencia
//     await new Promise((resolve) => setTimeout(resolve, 400));

//     const user = MOCK_USERS.find(
//       (u) =>
//         u.Usuario === credentials.user &&
//         u.Contraseña === credentials.pass
//     );

//     if (!user) {
//       return {
//         success: false,
//         error: 'Credenciales inválidas',
//       };
//     }

//     return {
//       success: true,
//       data: { user },
//     };
//   }
// }

// export default new UserService();

import apiClient from './apiClient';

class UserService {
  async login(credentials) {
    try {
      const response = await apiClient.post('/api/auth/login', {
        usuario: credentials.usuario,
        contraseña: credentials.contraseña,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Credenciales inválidas',
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
        error: err.response?.data?.error || 'Sesión expirada',
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
        error: err.response?.data?.error || 'Error al cerrar sesión',
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
        error: err.response?.data?.error || 'No se pudo obtener el usuario',
      };
    }
  }
}

export default new UserService();
