import { Fragment } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { MENSAJES, estrellasPorPorcentaje } from '../../utils/estrellas';
import { urlImagen } from '../../utils/imagenes';
import { tipoDe } from '../../components/preguntas/tipos';
import Estrellas from '../../components/Estrellas';

// Qué se respondió y cuál era la respuesta, en palabras, según el tipo.
function DetalleRepaso({ pregunta, d }) {
  const config = pregunta?.configuracion;

  switch (tipoDe(pregunta)) {
    case 'IMAGE_CHOICE': {
      const imagen = (id) => config.opciones.find((o) => o.id === id);
      const mostrar = d.esCorrecta ? imagen(d.respuestaDada) : imagen(d.respuestaCorrecta);
      return (
        <span className="repaso-imagen">
          <small>{d.esCorrecta ? 'Eligieron:' : 'La imagen era:'}</small>
          <img src={urlImagen(mostrar?.imagen)} alt={mostrar?.texto ?? ''} />
          {mostrar?.texto && <b>{mostrar.texto}</b>}
        </span>
      );
    }
    case 'ORDERING': {
      const texto = (id) => config.elementos.find((e) => e.id === id)?.texto;
      return (
        <>
          <small>
            Pusieron {d.aciertos} de {d.total} en su lugar. El orden era:
          </small>
          <span className="repaso-chips">
            {d.respuestaCorrecta.map((id, i) => (
              <Fragment key={id}>
                {i > 0 && <i aria-hidden="true">→</i>}
                <span>{texto(id)}</span>
              </Fragment>
            ))}
          </span>
        </>
      );
    }
    case 'MATCHING': {
      const izquierda = (id) => config.izquierda.find((x) => x.id === id)?.texto;
      const derecha = (id) => config.derecha.find((x) => x.id === id)?.texto;
      return (
        <>
          <small>
            Unieron bien {d.aciertos} de {d.total}. Las parejas eran:
          </small>
          <span className="repaso-chips">
            {d.respuestaCorrecta.map((p) => (
              <span key={p.izquierda}>
                {izquierda(p.izquierda)} <i aria-hidden="true">↔</i> {derecha(p.derecha)}
              </span>
            ))}
          </span>
        </>
      );
    }
    case 'CLASSIFICATION': {
      const texto = (id) => config.elementos.find((e) => e.id === id)?.texto;
      return (
        <>
          <small>
            Clasificaron bien {d.aciertos} de {d.total}. Así iban:
          </small>
          <span className="repaso-chips">
            {config.categorias.map((c) => (
              <span key={c.id}>
                <b>{c.nombre}:</b>{' '}
                {d.respuestaCorrecta
                  .filter((a) => a.categoria === c.id)
                  .map((a) => texto(a.elemento))
                  .join(', ')}
              </span>
            ))}
          </span>
        </>
      );
    }
    default:
      return d.esCorrecta ? (
        <small>Respondieron: {d.respuestaDada}</small>
      ) : (
        <small>
          La respuesta era: <b>{d.respuestaCorrecta}</b>
        </small>
      );
  }
}

export default function Resultado() {
  const { state } = useLocation();

  // Se llega aquí solo desde Actividad (con el resultado en el state). Un
  // reload o acceso directo no tiene qué mostrar; el resultado ya quedó
  // guardado en el backend y se ve en las estrellas de la actividad.
  if (!state?.resultado) {
    return <Navigate to="/grupo/modulos" replace />;
  }

  const { resultado, actividad } = state;
  const puntos = resultado.puntosObtenidos ?? Math.round((resultado.puntaje / resultado.puntajeTotal) * 100);
  const posibles = resultado.puntosPosibles ?? 100;
  const porcentaje = Math.round((puntos / posibles) * 100);
  const cantidad = estrellasPorPorcentaje(porcentaje);
  const mensaje = MENSAJES[cantidad];
  const porId = new Map(actividad.preguntas.map((p) => [p.id, p]));

  return (
    <div className="resultado">
      {cantidad >= 3 && (
        <div className="confeti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} style={{ '--i': i }} />
          ))}
        </div>
      )}

      <section className="resultado-card">
        <span className="resultado-sello">✓ Actividad completada</span>
        <Estrellas cantidad={cantidad} grande />
        <h1>{mensaje.titulo}</h1>
        <p className="resultado-texto">{mensaje.texto}</p>

        <dl className="resultado-datos">
          <div className="dato-aciertos">
            <dt>Aciertos</dt>
            <dd>
              {resultado.puntaje} <small>de {resultado.puntajeTotal}</small>
            </dd>
          </div>
          <div className="dato-resultado">
            <dt>Resultado</dt>
            <dd>{porcentaje} %</dd>
          </div>
          <div className="dato-puntos">
            <dt>Puntos</dt>
            <dd>
              {puntos} <small>/ {posibles}</small>
            </dd>
          </div>
          {resultado.intento && (
            <div className="dato-intento">
              <dt>Intento</dt>
              <dd>{resultado.intento}</dd>
            </div>
          )}
        </dl>

        <div className="resultado-acciones">
          <Link to={`/grupo/actividad/${actividad.id}`} className="boton-grande boton-blanco" replace>
            🔁 Otra vez
          </Link>
          <Link to={`/grupo/modulos/${actividad.modulo.id}`} className="boton-grande boton-teal">
            Volver a actividades
          </Link>
          <Link to="/grupo/modulos" className="boton-grande boton-naranja">
            Volver a módulos
          </Link>
        </div>
      </section>

      <section className="repaso">
        <h2>Repasemos juntos</h2>
        <ol>
          {resultado.detalle.map((d) => {
            const pregunta = porId.get(d.idPregunta);
            return (
              <li key={d.idPregunta} className={d.esCorrecta ? 'repaso-bien' : 'repaso-aprender'}>
                <span className="repaso-icono" aria-hidden="true">
                  {d.esCorrecta ? '✓' : '💡'}
                </span>
                <span>
                  <strong>{pregunta?.enunciado}</strong>
                  <DetalleRepaso pregunta={pregunta} d={d} />
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
