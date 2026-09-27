import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import grupoService from '../services/grupoService';
import { onGrupoSesionExpirada, setGrupoToken } from '../services/grupoClient';

// Sesión del coordinador de grupo (Módulo 3). Independiente de AuthContext:
// no hay refresh ni cookie; si el token vence, se vuelve a pedir el código.
const GrupoContext = createContext(null);

// Mismo patrón que AuthContext (hook + provider en un archivo).
// eslint-disable-next-line react-refresh/only-export-components
export const useGrupo = () => {
  const context = useContext(GrupoContext);
  if (!context) {
    throw new Error('useGrupo debe ser usado dentro de GrupoProvider');
  }
  return context;
};

export const GrupoProvider = ({ children }) => {
  const [grupo, setGrupo] = useState(null);
  const [expirada, setExpirada] = useState(false);

  useEffect(() => {
    onGrupoSesionExpirada(() => {
      setGrupoToken(null);
      setGrupo(null);
      setExpirada(true);
    });
    return () => onGrupoSesionExpirada(null);
  }, []);

  const entrar = useCallback(async (codigo) => {
    const result = await grupoService.login(codigo);
    if (result.success) {
      setGrupoToken(result.data.token);
      setGrupo(result.data.grupo);
      setExpirada(false);
    }
    return result;
  }, []);

  const salir = useCallback(() => {
    setGrupoToken(null);
    setGrupo(null);
    setExpirada(false);
  }, []);

  const value = { grupo, expirada, entrar, salir, activo: !!grupo };

  return <GrupoContext.Provider value={value}>{children}</GrupoContext.Provider>;
};
