import axios from 'axios';


// TODO BACKEND: cuando Antony despliegue en Railway, actualizar el valor de
// VITE_API_URL en el archivo .env (no tocar este archivo).
const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, 
  // TODO BACKEND: confirmar con Antony que su CORS tiene configurado
  // credentials: true en el backend también — withCredentials aquí no
  // sirve de nada si el servidor no lo permite del otro lado.
  withCredentials: true,
});

export default apiClient;