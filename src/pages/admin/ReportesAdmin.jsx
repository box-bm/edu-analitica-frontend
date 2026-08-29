import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CURSOS, PERIODOS, promedioCurso } from '../../data/mockData';

const dataEvolucion = PERIODOS.map((periodo, idx) => {
  const fila = { periodo };
  CURSOS.forEach((c) => {
    fila[c.nombre] = promedioCurso(c.id, idx);
  });
  return fila;
});

export default function ReportesAdmin() {
  return (
    <div>
      <div className="panel">
        <h3 className="panel-title">Evolución del promedio por curso</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dataEvolucion}>
            <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {CURSOS.map((c) => (
              <Line key={c.id} type="monotone" dataKey={c.nombre} stroke={c.color} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <h3 className="panel-title">Promedio por curso y periodo</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Curso</th>
              {PERIODOS.map((p) => (
                <th key={p}>{p}</th>
              ))}
              <th>Docente</th>
            </tr>
          </thead>
          <tbody>
            {CURSOS.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                {PERIODOS.map((_, idx) => (
                  <td key={idx}>{promedioCurso(c.id, idx).toFixed(1)}</td>
                ))}
                <td>{c.docente}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="insight-box">
        📈 Análisis: Idiomática e Historia muestran una tendencia de mejora sostenida en los tres periodos, mientras que
        Ciencias se mantiene estable. Se recomienda reforzar acompañamiento en los cursos con promedio bajo 3.5.
      </div>
    </div>
  );
}
