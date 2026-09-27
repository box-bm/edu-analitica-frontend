import StatCard from '../../dashboard/StatCard';
import { fechaReporte } from './formato';
import '../reportes.css';

// Mismos umbrales que src/utils/estrellas.js y el backend.
const nivelClase = (p) => (p >= 90 ? 'alto' : p >= 60 ? 'medio' : 'inicial');

// Estadísticas de GET /api/reportes/vista-previa (props de useCarga).
export default function VistaPrevia({ datos, error, cargando, recargar }) {
  if (cargando) return <p className="cargando">Calculando vista previa…</p>;

  if (error) {
    return (
      <div className="estado-vacio">
        <p>{error}</p>
        <button className="btn-secondary" onClick={recargar}>Reintentar</button>
      </div>
    );
  }

  if (!datos.hayResultados) {
    return (
      <div className="estado-vacio">
        <span className="estado-emoji">📊</span>
        <h3>Aún no hay resultados</h3>
        <p>Cuando los grupos de esta sección resuelvan actividades del módulo, verás aquí cómo les fue.</p>
      </div>
    );
  }

  const { totales, grupos, mejorGrupo, peorGrupo } = datos;

  return (
    <>
      <div className="kpi-grid">
        <StatCard label="Promedio de aciertos" value={`${totales.promedioPuntaje}%`} accent="var(--teal)" />
        <StatCard label="Intentos" value={totales.intentos} accent="var(--orange)" />
        <StatCard label="Grupos" value={totales.grupos} accent="var(--grape)" />
      </div>

      {/* El backend solo manda peorGrupo cuando hay al menos 2 grupos con intentos. */}
      {mejorGrupo && peorGrupo && (
        <div className="kpi-grid">
          <StatCard
            label="Mejor desempeño"
            value={mejorGrupo.nombreGrupo}
            hint={`${mejorGrupo.promedioPuntaje}% de aciertos`}
            accent="var(--leaf)"
          />
          <StatCard
            label="Conviene reforzar"
            value={peorGrupo.nombreGrupo}
            hint={`${peorGrupo.promedioPuntaje}% de aciertos`}
            accent="var(--sun)"
          />
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Actividades completadas</th>
            <th>Intentos</th>
            <th>Promedio</th>
            <th>Último intento</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map((g) => (
            <tr key={g.idGrupo}>
              <td>
                <strong>{g.nombreGrupo}</strong>
                {!g.activo && <span className="texto-suave"> (inactivo)</span>}
              </td>
              <td>
                {g.actividadesCompletadas} de {g.actividadesDisponibles}
              </td>
              <td>{g.intentos}</td>
              <td>
                {g.intentos > 0 ? (
                  <span className="barra-aciertos">
                    <span className={`progreso nivel-${nivelClase(g.promedioPuntaje)}`} style={{ width: 80 }}>
                      <span style={{ width: `${g.promedioPuntaje}%` }} />
                    </span>
                    <b>{g.promedioPuntaje}%</b>
                  </span>
                ) : (
                  <span className="texto-suave">Sin intentos</span>
                )}
              </td>
              <td>{g.ultimoIntento ? fechaReporte.format(new Date(g.ultimoIntento)) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
