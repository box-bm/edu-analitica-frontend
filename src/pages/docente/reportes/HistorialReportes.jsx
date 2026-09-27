import { esUrlPdfValida } from '../../../utils/urlPdf';
import { etiquetaSeccion, fechaReporte } from './formato';

// Historial de GET /api/reportes (props de useCarga). El PDF vive en Drive:
// se abre en otra pestaña, nunca embebido.
export default function HistorialReportes({ datos, error, cargando, recargar }) {
  if (cargando) return <p className="cargando">Cargando historial…</p>;

  if (error) {
    return (
      <div className="estado-vacio">
        <p>{error}</p>
        <button className="btn-secondary" onClick={recargar}>Reintentar</button>
      </div>
    );
  }

  if (datos.length === 0) {
    return (
      <div className="estado-vacio">
        <span className="estado-emoji">🗂️</span>
        <p>Todavía no hay reportes registrados para esta sección y módulo.</p>
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Sección</th>
          <th>Módulo</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {datos.map((r) => (
          <tr key={r.id}>
            <td>{fechaReporte.format(new Date(r.generadoEn))}</td>
            <td>{r.seccion ? etiquetaSeccion(r.seccion) : '—'}</td>
            <td>{r.modulo?.nombreModulo ?? '—'}</td>
            <td>
              {/* Segunda barrera ante un link no http(s) guardado: no se renderiza como enlace. */}
              {esUrlPdfValida(r.urlPdf) ? (
                <a className="btn-secondary btn-sm" href={r.urlPdf} target="_blank" rel="noopener noreferrer">
                  Abrir PDF ↗
                </a>
              ) : (
                <span className="texto-suave">Link no válido</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
