import { useState } from 'react';
import { CURSOS, CURSOS_DOCENTE_ACTUAL, ESTUDIANTES, NOTAS, PERIODOS, clasificacion } from '../../data/mockData';
import Badge from '../../components/dashboard/Badge';

const misCursos = CURSOS.filter((c) => CURSOS_DOCENTE_ACTUAL.includes(c.id));

export default function EstudiantesDocente() {
  const [notasLocal, setNotasLocal] = useState(NOTAS);
  const [form, setForm] = useState({ estudianteId: ESTUDIANTES[0].id, cursoId: misCursos[0].id, periodo: 0, nota: '' });
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const nota = Number(form.nota);
    if (Number.isNaN(nota) || nota < 0 || nota > 5) {
      setMensaje('Ingresa una nota válida entre 0.0 y 5.0');
      return;
    }
    setNotasLocal((prev) => {
      const copia = { ...prev, [form.estudianteId]: { ...prev[form.estudianteId] } };
      const notasCurso = [...copia[form.estudianteId][form.cursoId]];
      notasCurso[form.periodo] = nota;
      copia[form.estudianteId][form.cursoId] = notasCurso;
      return copia;
    });
    const estudiante = ESTUDIANTES.find((e) => e.id === Number(form.estudianteId));
    setMensaje(`Nota registrada para ${estudiante.nombre} (formulario simulado, no se envía al servidor).`);
  };

  return (
    <div>
      <div className="panel">
        <h3 className="panel-title">Registrar nota</h3>
        <form className="dashboard-form" onSubmit={handleSubmit}>
          <label className="form-field">
            Estudiante
            <select value={form.estudianteId} onChange={(e) => setForm({ ...form, estudianteId: Number(e.target.value) })}>
              {ESTUDIANTES.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Curso
            <select value={form.cursoId} onChange={(e) => setForm({ ...form, cursoId: e.target.value })}>
              {misCursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Periodo
            <select value={form.periodo} onChange={(e) => setForm({ ...form, periodo: Number(e.target.value) })}>
              {PERIODOS.map((p, idx) => (
                <option key={p} value={idx}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Nota (0.0 - 5.0)
            <input type="number" step="0.1" min="0" max="5" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} required />
          </label>
          <button type="submit" className="btn-primary">
            Guardar nota
          </button>
        </form>
        {mensaje && <p className="form-feedback">{mensaje}</p>}
      </div>

      <div className="panel">
        <h3 className="panel-title">Notas de mis estudiantes</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              {misCursos.map((c) => (
                <th key={c.id}>{c.nombre}</th>
              ))}
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ESTUDIANTES.map((est) => {
              const promedioGeneral = misCursos
                .map((c) => notasLocal[est.id][c.id].reduce((a, b) => a + b, 0) / notasLocal[est.id][c.id].length)
                .reduce((a, b) => a + b, 0) / misCursos.length;
              return (
                <tr key={est.id}>
                  <td>{est.nombre}</td>
                  {misCursos.map((c) => {
                    const notas = notasLocal[est.id][c.id];
                    const prom = notas.reduce((a, b) => a + b, 0) / notas.length;
                    return <td key={c.id}>{prom.toFixed(1)}</td>;
                  })}
                  <td>
                    <Badge>{clasificacion(promedioGeneral)}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
