import apiClient from './apiClient';

const error = (err, porDefecto) => ({
  success: false,
  error: err.response?.data?.message || porDefecto,
});

const params = ({ idGrado, ciclo } = {}) => ({
  ...(idGrado ? { idGrado } : {}),
  ...(ciclo ? { ciclo } : {}),
});

const paramsFiltro = ({ idSeccion, idModulo } = {}) => ({
  ...(idSeccion ? { idSeccion } : {}),
  ...(idModulo ? { idModulo } : {}),
});

// Se descarga con axios (no con un <a href>) porque la ruta exige el
// Authorization header, que un enlace normal no envía.
async function descargar(ruta, query, nombrePorDefecto) {
  try {
    const response = await apiClient.get(ruta, { params: query, responseType: 'blob' });
    const nombre =
      /filename="([^"]+)"/.exec(response.headers['content-disposition'] ?? '')?.[1] ?? nombrePorDefecto;
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

// Admin ve todos los grupos y el docente solo los suyos: lo decide el backend
// con el rol del token, no hay que pasar nada distinto desde aquí.
class ReportesService {
  async resumen(filtro) {
    try {
      const response = await apiClient.get('/api/reportes/resumen', { params: params(filtro) });
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo cargar el resumen');
    }
  }

  async porActividad(filtro) {
    try {
      const response = await apiClient.get('/api/reportes/actividades', { params: params(filtro) });
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo cargar el reporte');
    }
  }

  async descargarCsv(filtro) {
    return descargar('/api/reportes/resultados.csv', params(filtro), 'resultados.csv');
  }

  // --- Módulo 4: reportes por sección y módulo ---------------------------

  async vistaPrevia(filtro) {
    try {
      const response = await apiClient.get('/api/reportes/vista-previa', { params: paramsFiltro(filtro) });
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo cargar la vista previa');
    }
  }

  async exportarCsv(filtro) {
    return descargar('/api/reportes/export', paramsFiltro(filtro), 'reporte.csv');
  }

  async historial(filtro) {
    try {
      const response = await apiClient.get('/api/reportes', { params: paramsFiltro(filtro) });
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo cargar el historial de reportes');
    }
  }

  // Solo se registra el link (Drive): el PDF nunca se sube a la plataforma.
  async registrar({ idSeccion, idModulo, urlPdf }) {
    try {
      const response = await apiClient.post('/api/reportes', { idSeccion, idModulo, urlPdf });
      return { success: true, data: response.data };
    } catch (err) {
      return error(err, 'No se pudo registrar el reporte');
    }
  }
}

export default new ReportesService();
