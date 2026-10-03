import axios from 'axios';
import { API_TIMEOUT_MS } from './timeout';

// Cliente separado de apiClient a propósito: el token de grupo (Módulo 3) es
// otra sesión, de alcance limitado y sin refresh. Mezclarlo con el
// accessToken de docente/admin haría que uno pisara al otro.
const grupoClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: API_TIMEOUT_MS,
});

// Solo en memoria, nunca localStorage (mismo criterio que apiClient). Un
// reload obliga a volver a escribir el código, y eso es intencional.
let grupoToken = null;
let alExpirar = null;

export const setGrupoToken = (token) => {
  grupoToken = token;
};

// GrupoContext registra aquí qué hacer cuando el backend responde 401 (token
// vencido a los 45 min o código regenerado por el docente).
export const onGrupoSesionExpirada = (callback) => {
  alExpirar = callback;
};

grupoClient.interceptors.request.use((config) => {
  if (grupoToken) {
    config.headers.Authorization = `Bearer ${grupoToken}`;
  }
  return config;
});

grupoClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const esLogin = error.config?.url?.includes('/api/auth/grupo-login');
    if (error.response?.status === 401 && !esLogin && alExpirar) {
      alExpirar();
    }
    return Promise.reject(error);
  }
);

export default grupoClient;
