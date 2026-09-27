import { useCallback, useState } from 'react';
import useCarga from '../../hooks/useCarga';
import reportesService from '../../services/reportesService';
import './reportes.css';

const nivelClase = (p) => (p >= 90 ? 'alto' : p >= 60 ? 'medio' : 'inicial');

// Reporte por actividad + preguntas con más errores + exportación CSV.
// Lo usan admin (todos los grupos) y docente (sus grupos); el alcance lo
// aplica el backend según el rol.
export default function ReporteActividades({ grados = [] }) {
  const [idGrado, setIdGrado] = useState('');
  const [descargando, setDescargando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const cargar = useCallback(() => reportesService.porActividad(idGrado || undefined), [idGrado]);
  const { datos, error, cargando, recargar } = useCarga(cargar);

  const descargar = async () => {
    setDescargando(true);
    const result = await reportesService.descargarCsv(idGrado || undefined);
    setDescargando(false);
    setAviso(result.success ? null : result.error);
  };

  return (
    <div>
      <div className="panel">
        <div className="section-actions">
          <div>
            <h3 className="panel-title" style={{ margin: 0 }}>Aciertos por actividad</h3>
            <p className="texto-suave">De menor a mayor: arriba lo que más conviene reforzar.</p>
          </div>
          <div className="filtros">
            {grados.length > 0 && (
              <select className="form-field" value={idGrado} onChange={(e) => setIdGrado(e.target.value)} aria-label="Filtrar por grado">
                <option value="">Todos los grados</option>
                {grados.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.nombreGrado}
                  </option>
                ))}
              </select>
            )}
            <button className="btn-teal" onClick={descargar} disabled={descargando}>
              {descargando ? 'Preparando…' : '⬇ Exportar CSV'}
            </button>
          </div>
        </div>
        {aviso && <p className="form-error">{aviso}</p>}

        {cargando ? (
          <p className="cargando">Cargando reporte…</p>
        ) : error ? (
          <div className="estado-vacio">
            <p>{error}</p>
            <button className="btn-secondary" onClick={recargar}>Reintentar</button>
          </div>
        ) : datos.actividades.length === 0 ? (
          <div className="estado-vacio">
            <span className="estado-emoji">📊</span>
            <h3>Aún no hay resultados</h3>
            <p>Cuando los grupos terminen actividades, verás aquí cómo les fue.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Módulo</th>
                <th>Grado</th>
                <th>Intentos</th>
                <th>Grupos</th>
                <th>Aciertos</th>
              </tr>
            </thead>
            <tbody>
              {datos.actividades.map((a) => (
                <tr key={a.idActividad}>
                  <td><strong>{a.titulo}</strong></td>
                  <td>{a.modulo}</td>
                  <td>{a.grado}</td>
                  <td>{a.intentos}</td>
                  <td>{a.grupos}</td>
                  <td>
                    <span className="barra-aciertos">
                      <span className={`progreso nivel-${nivelClase(a.porcentajeAciertos)}`} style={{ width: 80 }}>
                        <span style={{ width: `${a.porcentajeAciertos}%` }} />
                      </span>
                      <b>{a.porcentajeAciertos}%</b>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {datos?.preguntasDificiles.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Preguntas para repasar en clase</h3>
          <p className="panel-subtitle">Las que más se equivocaron (al menos una respuesta incorrecta).</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Pregunta</th>
                <th>Actividad</th>
                <th>Respuesta correcta</th>
                <th>Respuestas</th>
                <th>Con error</th>
              </tr>
            </thead>
            <tbody>
              {datos.preguntasDificiles.map((p) => (
                <tr key={p.idPregunta}>
                  <td><strong>{p.enunciado}</strong></td>
                  <td>{p.actividad}</td>
                  <td>{p.respuestaCorrecta}</td>
                  <td>{p.respuestas}</td>
                  <td><b>{p.porcentajeErrores}%</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

