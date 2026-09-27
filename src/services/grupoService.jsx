import grupoClient from './grupoClient';

// Mensajes pensados para niños de 7–10 años: cortos y sin tono de error.
const mensaje = (err, porDefecto) => {
  if (err.response?.status === 429) return 'Espera un ratito y vuelve a intentarlo.';
  if (!err.response) return 'No hay conexión. Pide ayuda a tu maestra.';
  return porDefecto;
};

class GrupoService {
  async login(codigo) {
    try {
      const response = await grupoClient.post('/api/auth/grupo-login', {
        codigoAcceso: codigo,
      });
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: mensaje(err, 'Ese código no funcionó. Revísalo con tu maestra.'),
      };
    }
  }

  async actividades() {
    try {
      const response = await grupoClient.get('/api/grupo/me/actividades');
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: mensaje(err, 'No pudimos cargar las actividades.') };
    }
  }

  async avance() {
    try {
      const response = await grupoClient.get('/api/grupo/me/avance');
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: mensaje(err, 'No pudimos cargar tu avance.') };
    }
  }

  async preguntas(idActividad) {
    try {
      const response = await grupoClient.get(`/api/actividades/${idActividad}/preguntas`);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: mensaje(err, 'No pudimos abrir esta actividad.') };
    }
  }

  async enviarRespuestas(idActividad, respuestas) {
    try {
      const response = await grupoClient.post(`/api/actividades/${idActividad}/respuestas`, {
        respuestas,
      });
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: mensaje(err, 'No pudimos guardar tus respuestas.') };
    }
  }
}

export default new GrupoService();
