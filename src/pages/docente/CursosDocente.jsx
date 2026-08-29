import { CURSOS, CURSOS_DOCENTE_ACTUAL, ESTUDIANTES, PERIODOS, promedioCurso } from '../../data/mockData';

const misCursos = CURSOS.filter((c) => CURSOS_DOCENTE_ACTUAL.includes(c.id));

export default function CursosDocente() {
  return (
    <div className="panel-grid">
      {misCursos.map((curso) => (
        <div key={curso.id} className="panel">
          <h3 className="panel-title" style={{ color: curso.color }}>
            {curso.nombre}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 0 }}>Grado 9° · {ESTUDIANTES.length} estudiantes</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Promedio del curso</th>
              </tr>
            </thead>
            <tbody>
              {PERIODOS.map((p, idx) => (
                <tr key={p}>
                  <td>{p}</td>
                  <td>{promedioCurso(curso.id, idx).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
