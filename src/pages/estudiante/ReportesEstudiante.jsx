import { useState } from 'react';
import { CURSOS, ESTUDIANTE_ACTUAL_ID, NOTAS, PERIODOS } from '../../data/mockData';

export default function ReportesEstudiante() {
  const [descargando, setDescargando] = useState(false);

  const handleDescargar = () => {
    setDescargando(true);
    setTimeout(() => setDescargando(false), 1200);
  };

  return (
    <div className="panel">
      <div className="section-actions">
        <h3 className="panel-title" style={{ margin: 0 }}>
          Boletín de calificaciones
        </h3>
        <button className="btn-primary" onClick={handleDescargar} disabled={descargando}>
          {descargando ? 'Generando…' : 'Descargar boletín'}
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Materia</th>
            {PERIODOS.map((p) => (
              <th key={p}>{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CURSOS.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              {NOTAS[ESTUDIANTE_ACTUAL_ID][c.id].map((nota, idx) => (
                <td key={idx}>{nota.toFixed(1)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="form-feedback" style={{ color: '#94a3b8' }}>
        Datos de ejemplo — la descarga es simulada.
      </p>
    </div>
  );
}
