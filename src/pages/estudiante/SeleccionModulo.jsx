import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import grupoService from '../../services/grupoService';
import Estrellas from '../../components/Estrellas';
import { colorModulo, estrellas } from '../../utils/estrellas';

export default function SeleccionModulo() {
  const { idModulo } = useParams();
  const [modulos, setModulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      const result = await grupoService.actividades();
      if (cancelado) return;
      if (result.success) {
        setModulos(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [intentos]);

  if (cargando) {
    return <p className="cargando">Cargando actividades…</p>;
  }

  if (error) {
    return (
      <div className="grupo-mensaje">
        <span className="grupo-mensaje-emoji">📡</span>
        <p>{error}</p>
        <button
          className="boton-grande boton-teal"
          onClick={() => {
            setCargando(true);
            setIntentos((n) => n + 1);
          }}
        >
          Probar otra vez
        </button>
      </div>
    );
  }

  const indice = modulos.findIndex((m) => String(m.id) === idModulo);
  const modulo = modulos[indice];

  if (idModulo && modulo) {
    const color = colorModulo(indice);
    return (
      <div>
        <Link to="/grupo/modulos" className="volver">
          ← Módulos
        </Link>
        <div className={`modulo-cabecera color-${color}`}>
          <span className="modulo-icono-grande" aria-hidden="true">
            {modulo.icono ?? '📘'}
          </span>
          <div>
            <h1>{modulo.nombreModulo}</h1>
            {modulo.descripcion && <p>{modulo.descripcion}</p>}
          </div>
        </div>

        {modulo.actividades.length === 0 ? (
          <div className="grupo-mensaje">
            <span className="grupo-mensaje-emoji">🌱</span>
            <p>Pronto habrá actividades aquí.</p>
          </div>
        ) : (
          <div className="actividades-lista">
            {modulo.actividades.map((a, i) => (
              <Link
                key={a.id}
                to={`/grupo/actividad/${a.id}`}
                className={`actividad-tile color-${color} ${a.completada ? 'hecha' : ''}`}
              >
                <span className="actividad-numero">{a.completada ? '✓' : i + 1}</span>
                <span className="actividad-texto">
                  <strong>{a.titulo}</strong>
                  {a.descripcion && <small>{a.descripcion}</small>}
                </span>
                {a.completada ? (
                  <Estrellas cantidad={estrellas(a.mejorPuntaje, a.puntajeTotal)} />
                ) : (
                  <span className="actividad-jugar">¡Jugar! ▶</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const total = modulos.reduce((n, m) => n + m.actividades.length, 0);
  const hechas = modulos.reduce((n, m) => n + m.actividades.filter((a) => a.completada).length, 0);

  return (
    <div>
      <div className="grupo-bienvenida">
        <div>
          <h1>¿Qué aprendemos hoy?</h1>
          <p>Elijan un módulo para empezar.</p>
        </div>
        {total > 0 && (
          <div className="grupo-avance-total" aria-label={`${hechas} de ${total} actividades hechas`}>
            <span className="grupo-avance-numero">
              {hechas}
              <small>/{total}</small>
            </span>
            <span>actividades hechas</span>
          </div>
        )}
      </div>

      {modulos.length === 0 ? (
        <div className="grupo-mensaje">
          <span className="grupo-mensaje-emoji">🌱</span>
          <p>Todavía no hay módulos para su grado. ¡Pregunten a su maestra!</p>
        </div>
      ) : (
        <div className="modulos-grid">
          {modulos.map((m, i) => (
            <Link key={m.id} to={`/grupo/modulos/${m.id}`} className={`modulo-card color-${colorModulo(i)}`}>
              <span className="modulo-icono" aria-hidden="true">
                {m.icono ?? '📘'}
              </span>
              <h2>{m.nombreModulo}</h2>
              {m.descripcion && <p>{m.descripcion}</p>}
              <span className="modulo-progreso" aria-label={`${m.porcentajeCompletado}% completado`}>
                <span style={{ width: `${m.porcentajeCompletado}%` }} />
              </span>
              <span className="modulo-pie">
                {m.actividades.filter((a) => a.completada).length} de {m.actividades.length} actividades
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

