import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import grupoService from '../../services/grupoService';

const LETRAS = ['A', 'B', 'C', 'D'];

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
  const elegida = respuestas[pregunta.id];
  const esUltima = paso === preguntas.length - 1;

  const elegir = (opcion) => setRespuestas((r) => ({ ...r, [pregunta.id]: opcion }));

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
              className={`${i === paso ? 'actual' : ''} ${respuestas[p.id] ? 'respondida' : ''}`}
            />
          ))}
        </ol>
      </div>

      <section className="pregunta-card" key={pregunta.id}>
        <span className="pregunta-contador">
          Pregunta {paso + 1} de {preguntas.length}
        </span>
        <h1 className="pregunta-enunciado">{pregunta.enunciado}</h1>

        <div className={`opciones opciones-${pregunta.opciones.length}`}>
          {pregunta.opciones.map((opcion, i) => (
            <button
              key={opcion}
              className={`opcion opcion-${i} ${elegida === opcion ? 'elegida' : ''}`}
              onClick={() => elegir(opcion)}
              aria-pressed={elegida === opcion}
            >
              <span className="opcion-letra">{LETRAS[i]}</span>
              <span className="opcion-texto">{opcion}</span>
            </button>
          ))}
        </div>
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
            disabled={!elegida || enviando || preguntas.some((p) => !respuestas[p.id])}
          >
            {enviando ? 'Guardando…' : '¡Terminamos! 🎉'}
          </button>
        ) : (
          <button
            className="boton-grande boton-teal"
            onClick={() => setPaso((p) => p + 1)}
            disabled={!elegida}
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );
}
