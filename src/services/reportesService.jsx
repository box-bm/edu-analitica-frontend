import apiClient from './apiClient';

const error = (err, porDefecto) => ({
  success: false,
  error: err.response?.data?.message || porDefecto,
});

const params = (idGrado) => (idGrado ? { id_grado: idGrado } : {});

// Admin ve todos los grupos y el docente solo los suyos: lo decide el backend
// con el rol del token, no hay que pasar nada distinto desde aquí.
class ReportesService {
  async resumen(idGrado) {
    try {
      const response = await apiClient.get('/api/reportes/resumen', { params: params(idGrado) });
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo cargar el resumen');
    }
  }

  async porActividad(idGrado) {
    try {
      const response = await apiClient.get('/api/reportes/actividades', { params: params(idGrado) });
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo cargar el reporte');
    }
  }

  // Se descarga con axios (no con un <a href>) porque la ruta exige el
  // Authorization header, que un enlace normal no envía.
  async descargarCsv(idGrado) {
    try {
      const response = await apiClient.get('/api/reportes/resultados.csv', {
        params: params(idGrado),
        responseType: 'blob',
      });
      const nombre =
        /filename="([^"]+)"/.exec(response.headers['content-disposition'] ?? '')?.[1] ?? 'resultados.csv';
      const url = URL.createObjectURL(response.data);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      enlace.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (err) {
      return error(err, 'No se pudo descargar el CSV');
    }
  }
}

export default new ReportesService();
