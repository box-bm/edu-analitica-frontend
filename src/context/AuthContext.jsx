// import React, { createContext, useContext, useState, useEffect } from 'react';
// import userService from '../services/userService';

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth debe ser usado dentro de AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const storedUser = localStorage.getItem('edua-user');
//     if (storedUser) {
//       try {
//         const userData = JSON.parse(storedUser);
//         setUser(userData);
//       } catch (err) {
//         console.error('Error parsing stored user data:', err);
//         localStorage.removeItem('edua-user');
//       }
//     }
//     setLoading(false);
//   }, []);

//   const login = async (credentials) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const backendCredentials = {
//         user: credentials.usuario,
//         pass: credentials.contraseña
//       };
      
//       console.log('🔄 Transformando credenciales para backend:', {
//         frontend: credentials,
//         backend: { user: backendCredentials.user, pass: '***' }
//       });
      
//       const response = await userService.login(backendCredentials);
      
//       if (response.success && response.data) {
//         const userData = {
//           id: response.data.user.Id,
//           nombre: response.data.user.Nombre,
//           usuario: response.data.user.Usuario,
//           rol: response.data.user.Rol,
//           loginTime: new Date().toISOString()
//         };
        
//         setUser(userData);
//         localStorage.setItem('edua-user', JSON.stringify(userData));
//         return { success: true, user: userData };
//       } else {
//         throw new Error(response.error || 'Credenciales inválidas');
//       }
//     } catch (err) {
//       const errorMessage = err.response?.data?.error || err.message || 'Error en el login';
//       setError(errorMessage);
//       return { success: false, error: errorMessage };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = () => {
//     setUser(null);
//     setError(null);
//     localStorage.removeItem('edua-user');
//   };

//   const hasRole = (requiredRole) => {
//     if (!user) return false;
//     if (Array.isArray(requiredRole)) {
//       return requiredRole.includes(user.rol);
//     }
//     return user.rol === requiredRole;
//   };

//   const hasPermission = (permission) => {
//     if (!user) return false;
    
//     const permissions = {
//       'evidencias.crear': ['Alumno', 'Catedratico', 'Admin'],
//       'evidencias.ver': ['Alumno', 'Catedratico', 'Admin'],
//       'evidencias.editar': ['Alumno', 'Catedratico', 'Admin'],
      
//       'evidencias.aprobar': ['Catedratico', 'Admin'],
//       'evidencias.rechazar': ['Catedratico', 'Admin'],
//       'evidencias.revisar': ['Catedratico', 'Admin'],
      
//       'expedientes.crear': ['Alumno', 'Catedratico', 'Admin'],
//       'expedientes.ver': ['Alumno', 'Catedratico', 'Admin'],
//       'expedientes.editar': ['Catedratico', 'Admin'],
//       'expedientes.eliminar': ['Admin'],
      
//       'usuarios.ver': ['Catedratico', 'Admin'],
//       'usuarios.crear': ['Admin'],
//       'usuarios.editar': ['Admin'],
//       'usuarios.eliminar': ['Admin'],
      
//       'reportes.ver': ['Catedratico', 'Admin'],
//       'reportes.generar': ['Catedratico', 'Admin'],
//       'reportes.exportar': ['Catedratico', 'Admin'],
      
//       'dashboard.estadisticas': ['Catedratico', 'Admin'],
//       'dashboard.reportes': ['Catedratico', 'Admin']
//     };
    
//     const allowedRoles = permissions[permission] || [];
//     return allowedRoles.includes(user.rol);
//   };

//   const value = {
//     user,
//     loading,
//     error,
//     login,
//     logout,
//     hasRole,
//     hasPermission,
//     isAuthenticated: !!user
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

import React, { createContext, useContext, useState, useEffect } from 'react';
import userService from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Al montar la app, intenta recuperar sesión real vía refresh
  useEffect(() => {
    const restoreSession = async () => {
      const result = await userService.refresh();

      // TODO BACKEND: confirmar con Antony el shape real de la respuesta de
      // POST /api/auth/refresh. Aquí asumo que devuelve { user: {...} } igual
      // que login(). Si el refresh devuelve algo distinto (ej. solo un nuevo
      // token sin datos de usuario), puede que aquí necesitemos llamar
      // también a userService.me() para traer los datos del usuario.
      if (result.success && result.data?.user) {
        const userData = {
          id: result.data.user.Id,
          nombre: result.data.user.Nombre,
          usuario: result.data.user.Usuario,
          rol: result.data.user.Rol,
        };
        setUser(userData);
      }

      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      // TODO BACKEND: confirmar con Antony el nombre exacto de los campos
      // que espera POST /api/auth/login. Aquí mando { usuario, contraseña }
      // tal cual vienen del formulario — puede que el backend espere
      // { usuario, password } o algo distinto.
      const response = await userService.login(credentials);

      if (response.success && response.data) {
        // TODO BACKEND: confirmar el formato exacto de response.data.user.
        // Aquí asumo Id, Nombre, Usuario, Rol (con mayúscula inicial, como
        // en el mock viejo). Es muy probable que el backend real devuelva
        // en minúscula (id, nombre, usuario, rol) u otro formato.
        // Verificar con: console.log(response.data) antes de esta línea.
        const userData = {
          id: response.data.user.Id,
          nombre: response.data.user.Nombre,
          usuario: response.data.user.Usuario,
          rol: response.data.user.Rol,
        };

        setUser(userData);
        return { success: true, user: userData };
      } else {
        throw new Error(response.error || 'Credenciales inválidas');
      }
    } catch (err) {
      // TODO BACKEND: confirmar el formato del error que devuelve el backend
      // (err.response?.data?.error vs err.response?.data?.message, etc.)
      // userService.login() ya intenta leer err.response?.data?.error.
      const errorMessage = err.message || 'Error en el login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // TODO BACKEND: verificar que POST /api/auth/logout responda incluso si
    // la sesión ya expiró (para que el usuario siempre pueda "salir" sin
    // quedar atascado por un error de red).
    await userService.logout();
    setUser(null);
    setError(null);
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.rol);
    }
    return user.rol === requiredRole;
  };

  const hasPermission = (permission) => {
    if (!user) return false;

    // TODO BACKEND: confirmar que estos nombres de rol ('Alumno',
    // 'Catedratico', 'Admin') coincidan EXACTAMENTE (mayúsculas/minúsculas
    // y sin tildes) con lo que el backend devuelve en el JWT. Si no
    // coinciden, hasPermission() y hasRole() van a fallar silenciosamente
    // (todo se comporta como "sin permiso").
    const permissions = {
      'evidencias.crear': ['Alumno', 'Catedratico', 'Admin'],
      'evidencias.ver': ['Alumno', 'Catedratico', 'Admin'],
      'evidencias.editar': ['Alumno', 'Catedratico', 'Admin'],

      'evidencias.aprobar': ['Catedratico', 'Admin'],
      'evidencias.rechazar': ['Catedratico', 'Admin'],
      'evidencias.revisar': ['Catedratico', 'Admin'],

      'expedientes.crear': ['Alumno', 'Catedratico', 'Admin'],
      'expedientes.ver': ['Alumno', 'Catedratico', 'Admin'],
      'expedientes.editar': ['Catedratico', 'Admin'],
      'expedientes.eliminar': ['Admin'],

      'usuarios.ver': ['Catedratico', 'Admin'],
      'usuarios.crear': ['Admin'],
      'usuarios.editar': ['Admin'],
      'usuarios.eliminar': ['Admin'],

      'reportes.ver': ['Catedratico', 'Admin'],
      'reportes.generar': ['Catedratico', 'Admin'],
      'reportes.exportar': ['Catedratico', 'Admin'],

      'dashboard.estadisticas': ['Catedratico', 'Admin'],
      'dashboard.reportes': ['Catedratico', 'Admin']
    };

    const allowedRoles = permissions[permission] || [];
    return allowedRoles.includes(user.rol);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    hasRole,
    hasPermission,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};