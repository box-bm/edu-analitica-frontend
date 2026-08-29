import StatCard from '../../components/dashboard/StatCard';
import { CURSOS, CURSOS_DOCENTE_ACTUAL, ESTUDIANTES, promedioCurso } from '../../data/mockData';

const misCursos = CURSOS.filter((c) => CURSOS_DOCENTE_ACTUAL.includes(c.id));
const promedioMisCursos = (
  misCursos.reduce((acc, c) => acc + promedioCurso(c.id), 0) / misCursos.length
).toFixed(1);

export default function InicioDocente() {
  return (
    <div>
      <div className="welcome-card">
        <h2>Mis cursos</h2>
        <p>Resumen de {misCursos.map((c) => c.nombre).join(' y ')} para el grado 9°.</p>
      </div>

      <div className="kpi-grid">
        <StatCard label="Cursos a cargo" value={misCursos.length} accent="#2563eb" />
        <StatCard label="Estudiantes" value={ESTUDIANTES.length} accent="#16a34a" />
        <StatCard label="Promedio de mis cursos" value={promedioMisCursos} accent="#f59e0b" />
        <StatCard label="Formularios pendientes" value={2} hint="Notas del Periodo 3" accent="#dc2626" />
      </div>

      <div className="panel-grid">
        {misCursos.map((c) => (
          <div key={c.id} className="panel">
            <h3 className="panel-title" style={{ color: c.color }}>
              {c.nombre}
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              {ESTUDIANTES.length} estudiantes · Promedio actual {promedioCurso(c.id).toFixed(1)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
