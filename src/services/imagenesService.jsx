import apiClient from './apiClient';

const error = (err, porDefecto) => ({ success: false, error: err.response?.data?.message || porDefecto });

// Imágenes que sube el docente para preguntas de selección con imágenes. Se
// guardan en la base del backend (no hay servicio externo de almacenamiento).
class ImagenesService {
  async listar() {
    try {
      const response = await apiClient.get('/api/imagenes');
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudieron cargar tus imágenes');
    }
  }

  // `blob` ya comprimido (utils/comprimirImagen); viaja como bytes, no JSON.
  async subir(blob, nombre) {
    try {
      const response = await apiClient.post('/api/imagenes', blob, {
        params: { nombre },
        headers: { 'Content-Type': blob.type },
      });
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo subir la imagen');
    }
  }

  async eliminar(id) {
    try {
      const response = await apiClient.delete(`/api/imagenes/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo borrar la imagen');
    }
  }
}

export default new ImagenesService();
