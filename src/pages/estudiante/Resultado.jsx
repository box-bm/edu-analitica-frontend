import { Link, Navigate, useLocation } from 'react-router-dom';
import { MENSAJES, estrellas } from '../../utils/estrellas';
import Estrellas from '../../components/Estrellas';

export default function Resultado() {
  const { state } = useLocation();

  // Se llega aquí solo desde Actividad (con el resultado en el state). Un
  // reload o acceso directo no tiene qué mostrar.
  if (!state?.resultado) {
    return <Navigate to="/grupo/modulos" replace />;
  }

  const { resultado, actividad } = state;
  const cantidad = estrellas(resultado.puntaje, resultado.puntajeTotal);
  const mensaje = MENSAJES[cantidad];
  const porId = new Map(actividad.preguntas.map((p) => [p.id, p]));

  return (
    <div className="resultado">
      {cantidad >= 2 && (
        <div className="confeti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} style={{ '--i': i }} />
          ))}
        </div>
      )}

      <section className="resultado-card">
        <Estrellas cantidad={cantidad} grande />
        <h1>{mensaje.titulo}</h1>
        <p className="resultado-texto">{mensaje.texto}</p>
        <p className="resultado-puntaje">
          Acertaron <strong>{resultado.puntaje}</strong> de {resultado.puntajeTotal}
        </p>

        <div className="resultado-acciones">
          <Link to={`/grupo/actividad/${actividad.id}`} className="boton-grande boton-blanco" replace>
            🔁 Otra vez
          </Link>
          <Link to={`/grupo/modulos/${actividad.modulo.id}`} className="boton-grande boton-naranja">
            Más actividades →
          </Link>
        </div>
      </section>

      <section className="repaso">
        <h2>Repasemos juntos</h2>
        <ol>
          {resultado.detalle.map((d) => (
            <li key={d.idPregunta} className={d.esCorrecta ? 'repaso-bien' : 'repaso-aprender'}>
              <span className="repaso-icono" aria-hidden="true">
                {d.esCorrecta ? '✓' : '💡'}
              </span>
              <span>
                <strong>{porId.get(d.idPregunta)?.enunciado}</strong>
                {d.esCorrecta ? (
                  <small>Respondieron: {d.respuestaDada}</small>
                ) : (
                  <small>
                    La respuesta era: <b>{d.respuestaCorrecta}</b>
                  </small>
                )}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
