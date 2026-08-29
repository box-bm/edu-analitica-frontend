import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/dashboard/StatCard';
import Badge from '../../components/dashboard/Badge';
import { ESTUDIANTE_ACTUAL_ID, NOTAS, PERIODOS, clasificacion, promedioEstudianteCurso } from '../../data/mockData';

export default function MateriaEstudiante({ cursoId, cursoNombre, color }) {
  const notas = NOTAS[ESTUDIANTE_ACTUAL_ID][cursoId];
  const promedio = promedioEstudianteCurso(ESTUDIANTE_ACTUAL_ID, cursoId);
  const data = PERIODOS.map((periodo, idx) => ({ periodo, nota: notas[idx] }));

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label={`Promedio en ${cursoNombre}`} value={promedio.toFixed(1)} accent={color} />
        <StatCard label="Clasificación" value={clasificacion(promedio)} accent={color} />
      </div>

      <div className="panel">
        <h3 className="panel-title">Evolución de notas — {cursoNombre}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="nota" stroke={color} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Nota</th>
              <th>Clasificación</th>
            </tr>
          </thead>
          <tbody>
            {data.map((fila) => (
              <tr key={fila.periodo}>
                <td>{fila.periodo}</td>
                <td>{fila.nota.toFixed(1)}</td>
                <td>
                  <Badge>{clasificacion(fila.nota)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
