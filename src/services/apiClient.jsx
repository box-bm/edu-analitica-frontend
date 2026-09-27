import axios from 'axios';


// URL del backend: VITE_API_URL (.env en local, secret del workflow de deploy).
const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
  // Necesario para que viaje la cookie httpOnly del refresh token entre
  // dominios (el backend tiene CORS con credentials: true).
  withCredentials: true,
});

// accessToken vive solo en memoria (nunca en localStorage, por XSS) — se
// pierde en un reload a propósito, y se recupera vía /api/auth/refresh.
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default apiClient;