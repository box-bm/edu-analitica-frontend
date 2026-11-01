import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import grupoService from '../../services/grupoService';
import RenderizadorPregunta from '../../components/preguntas/RenderizadorPregunta';
import { TIPOS, estaRespondida, tipoDe } from '../../components/preguntas/tipos';

export default function Actividad() {
  const { idActividad } = useParams();
  const navigate = useNavigate();
  const [actividad, setActividad] = useState(null);
  const [error, setError] = useState(null);
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      const result = await grupoService.preguntas(idActividad);
      if (cancelado) return;
      if (result.success) {
        setActividad(result.data);
      } else {
        setError(result.error);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [idActividad]);

  if (error) {
    return (
      <div className="grupo-mensaje">
        <span className="grupo-mensaje-emoji">🧭</span>
        <p>{error}</p>
        <Link to="/grupo/modulos" className="boton-grande boton-teal">
          Volver a los módulos
        </Link>
      </div>
    );
  }

  if (!actividad) {
    return <p className="cargando">Preparando la actividad…</p>;
  }

  const preguntas = actividad.preguntas;
  const pregunta = preguntas[paso];
  const respondida = (p) => estaRespondida(p, respuestas[p.id]);
  const lista = respondida(pregunta);
  const esUltima = paso === preguntas.length - 1;

  const responder = (valor) => setRespuestas((r) => ({ ...r, [pregunta.id]: valor }));

  const terminar = async () => {
    setEnviando(true);
    const result = await grupoService.enviarRespuestas(
      actividad.id,
      preguntas.map((p) => ({ idPregunta: p.id, respuesta: respuestas[p.id] }))
    );
    setEnviando(false);

    if (result.success) {
      navigate('/grupo/resultado', {
        replace: true,
        state: { resultado: result.data, actividad },
      });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="actividad-juego">
      <div className="actividad-barra">
        <Link to={`/grupo/modulos/${actividad.modulo.id}`} className="volver">
          ← {actividad.modulo.nombreModulo}
        </Link>
        <ol className="pasos" aria-label={`Pregunta ${paso + 1} de ${preguntas.length}`}>
          {preguntas.map((p, i) => (
            <li
              key={p.id}
              className={`${i === paso ? 'actual' : ''} ${respondida(p) ? 'respondida' : ''}`}
            />
          ))}
        </ol>
      </div>

      <section className={`pregunta-card pregunta-${tipoDe(pregunta).toLowerCase()}`} key={pregunta.id}>
        <span className="pregunta-contador">
          Pregunta {paso + 1} de {preguntas.length}
        </span>
        <h1 className="pregunta-enunciado">{pregunta.enunciado}</h1>
        {tipoDe(pregunta) !== 'MULTIPLE_CHOICE' && (
          <p className="pregunta-instruccion">
            <span aria-hidden="true">{TIPOS[tipoDe(pregunta)].icono}</span>
            {TIPOS[tipoDe(pregunta)].instruccion}
          </p>
        )}

        <RenderizadorPregunta pregunta={pregunta} respuesta={respuestas[pregunta.id]} onResponder={responder} />
      </section>

      <div className="actividad-navegacion">
        <button
          className="boton-grande boton-blanco"
          onClick={() => setPaso((p) => p - 1)}
          disabled={paso === 0 || enviando}
        >
          ← Atrás
        </button>
        {esUltima ? (
          <button
            className="boton-grande boton-naranja"
            onClick={terminar}
            disabled={!lista || enviando || preguntas.some((p) => !respondida(p))}
          >
            {enviando ? 'Guardando…' : '¡Terminamos! 🎉'}
          </button>
        ) : (
          <button
            className="boton-grande boton-teal"
            onClick={() => setPaso((p) => p + 1)}
            disabled={!lista}
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );
}
