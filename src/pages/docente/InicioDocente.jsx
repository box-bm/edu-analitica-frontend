import { useAuth } from '../../context/AuthContext';
import useCarga from '../../hooks/useCarga';
import StatCard from '../../components/dashboard/StatCard';
import GraficasResumen from '../../components/reportes/GraficasResumen';
import reportesService from '../../services/reportesService';

const cargarResumen = () => reportesService.resumen();

export default function InicioDocente() {
  const { user } = useAuth();
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
        <h2>Tus grupos, {user?.nombre?.split(' ')[0] ?? 'docente'}</h2>
        <p>
          {totales.grupos === 0
            ? 'Todavía no tienes grupos: créalos en la pestaña Grupos y comparte su código con cada equipo.'
            : 'Así van tus grupos con las actividades. Los detalles por pregunta están en Reportes.'}
        </p>
      </div>

      <div className="kpi-grid">
        <StatCard label="Mis grupos" value={totales.grupos} accent="var(--orange)" />
        <StatCard label="Actividades disponibles" value={totales.actividades} hint="Catálogo + propias" accent="var(--grape)" />
        <StatCard label="Actividades terminadas" value={totales.intentos} accent="var(--teal)" />
        <StatCard label="Aciertos" value={totales.intentos ? `${totales.porcentajeAciertos}%` : '—'} accent="var(--sun)" />
      </div>

      <GraficasResumen resumen={datos} />
    </div>
  );
}
