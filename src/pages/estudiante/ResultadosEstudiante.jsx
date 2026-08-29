import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { CURSOS, ESTUDIANTE_ACTUAL_ID, promedioCurso, promedioEstudianteCurso, promedioEstudianteGeneral } from '../../data/mockData';

const data = CURSOS.map((c) => ({
  curso: c.nombre,
  Yo: promedioEstudianteCurso(ESTUDIANTE_ACTUAL_ID, c.id),
  'Promedio del grado': promedioCurso(c.id),
}));

export default function ResultadosEstudiante() {
  const promedio = promedioEstudianteGeneral(ESTUDIANTE_ACTUAL_ID);
  const promedioGrado = (data.reduce((acc, d) => acc + d['Promedio del grado'], 0) / data.length).toFixed(1);

  return (
    <div>
      <div className="panel">
        <h3 className="panel-title">Tu desempeño vs. el promedio del grado</h3>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="curso" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
            <Radar name="Yo" dataKey="Yo" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
            <Radar name="Promedio del grado" dataKey="Promedio del grado" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="insight-box">
        {promedio >= promedioGrado
          ? `🎉 Análisis: tu promedio general (${promedio.toFixed(1)}) está por encima del promedio del grado (${promedioGrado}). ¡Buen trabajo!`
          : `📌 Análisis: tu promedio general (${promedio.toFixed(1)}) está por debajo del promedio del grado (${promedioGrado}). Enfócate en las materias donde tu resultado es más bajo.`}
      </div>
    </div>
  );
}
