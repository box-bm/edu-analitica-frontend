import { createContext, useContext, useState, useEffect } from 'react';
import userService from '../services/userService';
import { setAccessToken } from '../services/apiClient';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
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
      // POST /api/auth/refresh only returns a new accessToken, no user data,
      // so fetch the current user separately once the session is confirmed.
      const result = await userService.refresh();

      if (result.success) {
        setAccessToken(result.data.accessToken);

        // GET /api/usuarios/me returns the user directly (not wrapped), with
        // nombreCompleto and a nested rol: { id, nombreRol } — a different
        // shape than POST /api/auth/login's flat { id, nombre, rol }.
        const me = await userService.me();
        if (me.success && me.data) {
          const userData = {
            id: me.data.id,
            nombre: me.data.nombreCompleto,
            usuario: me.data.usuario,
            rol: me.data.rol.nombreRol,
          };
          setUser(userData);
        }
      }

      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.login(credentials);

      if (response.success && response.data) {
        setAccessToken(response.data.accessToken);

        // POST /api/auth/login returns { accessToken, usuario: { id, nombre, rol } }
        // (no username field here — that's only on GET /api/usuarios/me)
        const userData = {
          id: response.data.usuario.id,
          nombre: response.data.usuario.nombre,
          rol: response.data.usuario.rol,
        };

        setUser(userData);
        return { success: true, user: userData };
      } else {
        throw new Error(response.error || 'Credenciales inválidas');
      }
    } catch (err) {
      const errorMessage = err.message || 'Error en el login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // El backend responde 204 aunque la sesión ya no exista, y userService
    // captura errores de red: la sesión local siempre se limpia.
    await userService.logout();
    setAccessToken(null);
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

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    hasRole,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};