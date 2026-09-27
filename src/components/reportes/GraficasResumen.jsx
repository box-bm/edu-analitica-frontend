import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EJE, NIVELES, REJILLA, SERIE } from './colores';
import './reportes.css';

const NOMBRE_NIVEL = { alto: 'Alto', medio: 'Medio', inicial: 'Inicial' };

const diaCorto = new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const formatoDia = (fecha) => diaCorto.format(new Date(`${fecha}T00:00:00Z`));

const tick = { fontSize: 12, fill: EJE };

function SinDatos({ texto = 'Todavía no hay intentos registrados.' }) {
  return <p className="grafica-vacia">{texto}</p>;
}

// Tres gráficas a partir de GET /api/reportes/resumen. Cada una responde una
// sola pregunta: ¿en qué módulo aciertan más/menos?, ¿cómo se reparten los
// intentos por nivel?, ¿cuánto se está usando la plataforma?
export default function GraficasResumen({ resumen }) {
  const { porModulo, distribucion, actividadDiaria } = resumen;
  const modulos = porModulo.map((m) => ({
    ...m,
    etiqueta: `${m.grado ?? ''} · ${m.modulo}`,
  }));
  const niveles = ['inicial', 'medio', 'alto'].map((n) => ({
    nivel: n,
    nombre: NOMBRE_NIVEL[n],
    intentos: distribucion[n],
  }));
  const hayIntentos = niveles.some((n) => n.intentos > 0);

  return (
    <div className="panel-grid">
      <section className="panel">
        <h3 className="panel-title">Aciertos por módulo</h3>
        <p className="panel-subtitle">Porcentaje de respuestas correctas de todos los intentos.</p>
        {modulos.length === 0 ? (
          <SinDatos />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, modulos.length * 48)}>
            <BarChart data={modulos} layout="vertical" margin={{ left: 8, right: 40 }}>
              <CartesianGrid horizontal={false} stroke={REJILLA} />
              <XAxis type="number" domain={[0, 100]} tick={tick} unit="%" />
              <YAxis type="category" dataKey="etiqueta" width={150} tick={tick} />
              <Tooltip formatter={(v, _n, p) => [`${v}% · ${p.payload.intentos} intentos`, 'Aciertos']} />
              <Bar dataKey="porcentajeAciertos" fill={SERIE} radius={[0, 4, 4, 0]} barSize={22}>
                <LabelList dataKey="porcentajeAciertos" position="right" formatter={(v) => `${v}%`} fill="#16284d" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title">Intentos por nivel de logro</h3>
        <p className="panel-subtitle">Inicial &lt; 60% · Medio 60–89% · Alto ≥ 90% (las estrellas que ven los niños).</p>
        {!hayIntentos ? (
          <SinDatos />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={niveles} margin={{ top: 20 }}>
              <CartesianGrid vertical={false} stroke={REJILLA} />
              <XAxis dataKey="nombre" tick={tick} interval={0} />
              <YAxis allowDecimals={false} tick={tick} width={32} />
              <Tooltip formatter={(v) => [v, 'Intentos']} />
              <Bar dataKey="intentos" radius={[4, 4, 0, 0]} barSize={48} minPointSize={2}>
                {niveles.map((n) => (
                  <Cell key={n.nivel} fill={NIVELES[n.nivel]} />
                ))}
                {/* minPointSize hace visible el 0 (y su etiqueta): una barra ausente se leería como "sin dato". */}
                <LabelList dataKey="intentos" position="top" fill="#16284d" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title">Actividad de los últimos 14 días</h3>
        <p className="panel-subtitle">Actividades terminadas por día.</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={actividadDiaria} margin={{ top: 10, right: 12 }}>
            <CartesianGrid vertical={false} stroke={REJILLA} />
            <XAxis dataKey="fecha" tickFormatter={formatoDia} tick={tick} interval="preserveStartEnd" minTickGap={24} />
            <YAxis allowDecimals={false} tick={tick} width={32} />
            <Tooltip labelFormatter={formatoDia} formatter={(v) => [v, 'Intentos']} />
            <Line type="monotone" dataKey="intentos" stroke={SERIE} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
