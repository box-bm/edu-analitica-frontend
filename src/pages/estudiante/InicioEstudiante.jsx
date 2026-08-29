import StatCard from '../../components/dashboard/StatCard';
import { CURSOS, ESTUDIANTE_ACTUAL_ID, NOTAS, promedioEstudianteCurso, promedioEstudianteGeneral } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

const notasEstudiante = NOTAS[ESTUDIANTE_ACTUAL_ID];
const promediosPorCurso = CURSOS.map((c) => ({ curso: c.nombre, promedio: promedioEstudianteCurso(ESTUDIANTE_ACTUAL_ID, c.id) }));
const mejor = [...promediosPorCurso].sort((a, b) => b.promedio - a.promedio)[0];
const peor = [...promediosPorCurso].sort((a, b) => a.promedio - b.promedio)[0];

export default function InicioEstudiante() {
  const { user } = useAuth();

  return (
    <div>
      <div className="welcome-card">
        <h2>Hola, {user?.nombre ?? 'estudiante'} 👋</h2>
        <p>Este es tu resumen académico del año escolar 2026.</p>
      </div>

      <div className="kpi-grid">
        <StatCard label="Promedio general" value={promedioEstudianteGeneral(ESTUDIANTE_ACTUAL_ID).toFixed(1)} accent="#2563eb" />
        <StatCard label="Mejor materia" value={mejor.curso} hint={mejor.promedio.toFixed(1)} accent="#16a34a" />
        <StatCard label="A reforzar" value={peor.curso} hint={peor.promedio.toFixed(1)} accent="#dc2626" />
        <StatCard label="Cursos matriculados" value={Object.keys(notasEstudiante).length} accent="#7c3aed" />
      </div>

      <div className="panel">
        <h3 className="panel-title">Promedio por materia</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Promedio</th>
              <th>Docente</th>
            </tr>
          </thead>
          <tbody>
            {CURSOS.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{promedioEstudianteCurso(ESTUDIANTE_ACTUAL_ID, c.id).toFixed(1)}</td>
                <td>{c.docente}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
