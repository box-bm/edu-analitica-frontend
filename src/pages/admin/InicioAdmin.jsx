import useCarga from '../../hooks/useCarga';
import StatCard from '../../components/dashboard/StatCard';
import GraficasResumen from '../../components/reportes/GraficasResumen';
import reportesService from '../../services/reportesService';

const cargarResumen = () => reportesService.resumen();

export default function InicioAdmin() {
  const { datos, error, cargando, recargar } = useCarga(cargarResumen);

  if (cargando) return <p className="cargando">Cargando resumen…</p>;
  if (error) {
    return (
      <div className="panel estado-vacio">
        <span className="estado-emoji">📡</span>
        <p>{error}</p>
        <button className="btn-secondary" onClick={recargar}>Reintentar</button>
      </div>
    );
  }

  const { totales } = datos;

  return (
    <div>
      <div className="welcome-card">
        <h2>Panel general del colegio</h2>
        <p>Actividad y aciertos de todos los grupos de 1ro a 3ro primaria.</p>
      </div>

      <div className="kpi-grid">
        <StatCard label="Docentes activos" value={totales.docentes} accent="var(--orange)" />
        <StatCard label="Secciones" value={totales.secciones} accent="var(--sun)" />
        <StatCard label="Grupos activos" value={totales.grupos} accent="var(--grape)" />
        <StatCard label="Actividades terminadas" value={totales.intentos} hint={`${totales.actividades} actividades disponibles`} accent="var(--teal)" />
        <StatCard label="Aciertos" value={totales.intentos ? `${totales.porcentajeAciertos}%` : '—'} accent="var(--sky)" />
      </div>

      <GraficasResumen resumen={datos} />
    </div>
  );
}
