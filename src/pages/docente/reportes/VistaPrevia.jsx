import StatCard from '../../../components/dashboard/StatCard';
import '../../../components/reportes/reportes.css';

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

  if (datos.totales.intentos === 0) {
    return (
      <div className="estado-vacio">
        <span className="estado-emoji">📊</span>
        <h3>Aún no hay resultados</h3>
        <p>Cuando los grupos de esta sección resuelvan actividades del módulo, verás aquí cómo les fue.</p>
      </div>
    );
  }

  const { totales, grupos, mejorGrupo, peorGrupo } = datos;
  // Con un solo grupo, "mejor" y "a reforzar" serían el mismo: no se muestran.
  const comparar = mejorGrupo && peorGrupo && mejorGrupo.idGrupo !== peorGrupo.idGrupo;

  return (
    <>
      <div className="kpi-grid">
        <StatCard label="Promedio de aciertos" value={`${totales.porcentajePromedio}%`} accent="var(--teal)" />
        <StatCard label="Intentos" value={totales.intentos} accent="var(--orange)" />
        <StatCard label="Grupos" value={totales.grupos} accent="var(--grape)" />
        <StatCard label="Actividades del módulo" value={totales.actividades} accent="var(--sky)" />
      </div>

      {comparar && (
        <div className="kpi-grid">
          <StatCard
            label="Mejor desempeño"
            value={mejorGrupo.nombreGrupo}
            hint={`${mejorGrupo.porcentajePromedio}% de aciertos`}
            accent="var(--leaf)"
          />
          <StatCard
            label="Conviene reforzar"
            value={peorGrupo.nombreGrupo}
            hint={`${peorGrupo.porcentajePromedio}% de aciertos`}
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
          </tr>
        </thead>
        <tbody>
          {grupos.map((g) => (
            <tr key={g.idGrupo}>
              <td><strong>{g.nombreGrupo}</strong></td>
              <td>
                {g.actividadesCompletadas} de {totales.actividades}
              </td>
              <td>{g.intentos}</td>
              <td>
                <span className="barra-aciertos">
                  <span className={`progreso nivel-${nivelClase(g.porcentajePromedio)}`} style={{ width: 80 }}>
                    <span style={{ width: `${g.porcentajePromedio}%` }} />
                  </span>
                  <b>{g.porcentajePromedio}%</b>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
