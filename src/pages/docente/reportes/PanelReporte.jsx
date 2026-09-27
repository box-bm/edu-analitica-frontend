import { useCallback, useState } from 'react';
import useCarga from '../../../hooks/useCarga';
import reportesService from '../../../services/reportesService';
import HistorialReportes from './HistorialReportes';
import RegistrarReporte from './RegistrarReporte';
import VistaPrevia from './VistaPrevia';
import './reportes-seccion.css';

// Todo lo de una sección + módulo: vista previa (calculada por el backend,
// sin Colab), exportar CSV, registrar el link del PDF e historial.
// ReportesSeccion lo monta con `key` por filtro, así que cada cambio de
// filtro empieza con estado limpio.
export default function PanelReporte({ seccion, modulo }) {
  const idSeccion = seccion.id;
  const idModulo = modulo.id;

  const cargarVista = useCallback(
    () => reportesService.vistaPrevia({ idSeccion, idModulo }),
    [idSeccion, idModulo]
  );
  const cargarHistorial = useCallback(
    () => reportesService.historial({ idSeccion, idModulo }),
    [idSeccion, idModulo]
  );
  const vista = useCarga(cargarVista);
  const historial = useCarga(cargarHistorial);

  const [descargando, setDescargando] = useState(false);
  const [avisoCsv, setAvisoCsv] = useState(null);

  const exportar = async () => {
    setDescargando(true);
    const result = await reportesService.exportarCsv({ idSeccion, idModulo });
    setDescargando(false);
    setAvisoCsv(result.success ? null : result.error);
  };

  return (
    <div className="pila-reportes">
      <div className="panel">
        <div className="section-actions">
          <div>
            <h3 className="panel-title" style={{ margin: 0 }}>Vista previa</h3>
            <p className="texto-suave">Calculada al momento con los resultados de tus grupos.</p>
          </div>
          <button className="btn-teal" onClick={exportar} disabled={descargando}>
            {descargando ? 'Preparando…' : '⬇ Exportar CSV'}
          </button>
        </div>
        {avisoCsv && <p className="form-error">{avisoCsv}</p>}
        <VistaPrevia {...vista} />
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3 className="panel-title">Registrar reporte</h3>
          <ol className="pasos-reporte">
            <li>Exporta el CSV con el botón de arriba.</li>
            <li>Ábrelo en el notebook de Colab y genera el PDF.</li>
            <li>Sube el PDF a Google Drive y copia el link para compartir.</li>
            <li>Pégalo aquí.</li>
          </ol>
          <RegistrarReporte idSeccion={idSeccion} idModulo={idModulo} onRegistrado={historial.recargar} />
        </div>

        <div className="panel">
          <h3 className="panel-title">Historial</h3>
          <p className="panel-subtitle">Reportes registrados para esta sección y módulo, del más reciente al más antiguo.</p>
          <HistorialReportes {...historial} />
        </div>
      </div>
    </div>
  );
}
