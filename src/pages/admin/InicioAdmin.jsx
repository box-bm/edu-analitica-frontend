import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from '../../components/dashboard/StatCard';
import { CURSOS, ESTUDIANTES, USUARIOS, promedioCurso, promedioGeneralColegio, promedioEstudianteGeneral, clasificacion } from '../../data/mockData';

const docentesActivos = USUARIOS.filter((u) => u.rol === 'Docente').length;

const dataPorCurso = CURSOS.map((c) => ({ nombre: c.nombre, promedio: promedioCurso(c.id) }));

const distribucion = ['Excelente', 'Bueno', 'Regular', 'Bajo'].map((etiqueta) => ({
  name: etiqueta,
  value: ESTUDIANTES.filter((e) => clasificacion(promedioEstudianteGeneral(e.id)) === etiqueta).length,
}));

const COLORES = { Excelente: '#16a34a', Bueno: '#2563eb', Regular: '#f59e0b', Bajo: '#dc2626' };

export default function InicioAdmin() {
  return (
    <div>
      <div className="welcome-card">
        <h2>Panel general del colegio</h2>
        <p>Resumen de rendimiento académico de todos los cursos y estudiantes.</p>
      </div>

      <div className="kpi-grid">
        <StatCard label="Estudiantes" value={ESTUDIANTES.length} accent="#2563eb" />
        <StatCard label="Docentes" value={docentesActivos} accent="#16a34a" />
        <StatCard label="Cursos activos" value={CURSOS.length} accent="#f59e0b" />
        <StatCard label="Promedio institucional" value={promedioGeneralColegio().toFixed(1)} accent="#7c3aed" />
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3 className="panel-title">Promedio por curso</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dataPorCurso}>
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="promedio" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3 className="panel-title">Distribución de rendimiento</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={distribucion} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                {distribucion.map((d) => (
                  <Cell key={d.name} fill={COLORES[d.name]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
