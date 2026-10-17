import axios from 'axios';
import { API_TIMEOUT_MS } from './timeout';


// URL del backend: VITE_API_URL (.env en local, secret del workflow de deploy).
const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: API_TIMEOUT_MS,
  // Necesario para que viaje la cookie httpOnly del refresh token entre
  // dominios (el backend tiene CORS con credentials: true).
  withCredentials: true,
});

// accessToken vive solo en memoria (nunca en localStorage, por XSS) — se
// pierde en un reload a propósito, y se recupera vía /api/auth/refresh.
let accessToken = null;
let refreshEnCurso = null;
let alExpirar = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

// AuthContext registra aquí qué hacer cuando la sesión ya no se puede
// recuperar (el refresh respondió 401): limpiar el usuario y volver al login.
export const onSesionExpirada = (callback) => {
  alExpirar = callback;
};

// El backend rota la cookie del refresh en cada llamada y, pasados 30 s,
// trata el reuso de una cookie vieja como robo (cierra TODAS las sesiones).
// Por eso hay un solo refresh en vuelo: quien llegue mientras tanto espera la
// misma promesa. Lo usan el interceptor y el restoreSession del reload.
export const refrescarSesion = () => {
  if (!refreshEnCurso) {
    refreshEnCurso = apiClient
      .post('/api/auth/refresh')
      .then((response) => {
        setAccessToken(response.data.accessToken);
        return response.data.accessToken;
      })
      .catch((err) => {
        if (err.response?.status === 401) setAccessToken(null);
        throw err;
      })
      .finally(() => {
        refreshEnCurso = null;
      });
  }
  return refreshEnCurso;
};

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Un 401 en una ruta protegida significa accessToken vencido: se refresca una
// vez y se reintenta. Las rutas de /api/auth/* nunca disparan el refresh
// (login con credenciales malas, el propio refresh, logout) y una request ya
// reintentada no vuelve a intentarlo, así que no hay loop posible.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const esAuth = config?.url?.includes('/api/auth/');
    if (error.response?.status !== 401 || !config || esAuth || config._reintentado) {
      return Promise.reject(error);
    }

    try {
      await refrescarSesion();
    } catch (errRefresh) {
      // Solo un 401 del refresh cierra la sesión; un corte de red o un 502
      // del arranque en frío deja todo como está y falla solo esta request.
      if (errRefresh.response?.status === 401) alExpirar?.();
      return Promise.reject(error);
    }
    return apiClient({ ...config, _reintentado: true });
  }
);

export default apiClient;
