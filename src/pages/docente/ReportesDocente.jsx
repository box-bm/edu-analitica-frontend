import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CURSOS, CURSOS_DOCENTE_ACTUAL, PERIODOS, promedioCurso } from '../../data/mockData';

const misCursos = CURSOS.filter((c) => CURSOS_DOCENTE_ACTUAL.includes(c.id));

const data = PERIODOS.map((periodo, idx) => {
  const fila = { periodo };
  misCursos.forEach((c) => {
    fila[c.nombre] = promedioCurso(c.id, idx);
  });
  return fila;
});

export default function ReportesDocente() {
  return (
    <div>
      <div className="panel">
        <h3 className="panel-title">Rendimiento por periodo</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {misCursos.map((c) => (
              <Bar key={c.id} dataKey={c.nombre} fill={c.color} radius={[6, 6, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="insight-box">
        📊 Análisis: Idiomática mejoró un 8% entre el Periodo 1 y el Periodo 3. Matemática se mantiene estable, con dos
        estudiantes por debajo del promedio del grado que podrían necesitar refuerzo.
      </div>
    </div>
  );
}
