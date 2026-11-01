import { TIPOS, tipoDe } from '../../../components/preguntas/tipos';
import { urlImagen } from '../../../utils/imagenes';

// Lectura de una pregunta con su respuesta correcta (catálogo base, que el
// docente no puede editar).
export default function VistaPregunta({ pregunta: p }) {
  const tipo = tipoDe(p);
  const c = p.configuracion;

  let contenido;
  switch (tipo) {
    case 'IMAGE_CHOICE':
      contenido = (
        <ul className="lectura-imagenes">
          {c.opciones.map((o) => (
            <li key={o.id} className={o.correcta ? 'correcta' : ''}>
              <img src={urlImagen(o.imagen)} alt={o.texto ?? ''} />
              <span>
                {o.correcta ? '✓ ' : ''}
                {o.texto ?? ''}
              </span>
            </li>
          ))}
        </ul>
      );
      break;
    case 'ORDERING':
      contenido = (
        <ul>
          {c.elementos.map((e, i) => (
            <li key={e.id}>
              {i + 1}. {e.texto}
            </li>
          ))}
        </ul>
      );
      break;
    case 'MATCHING':
      contenido = (
        <ul>
          {c.pares.map((x) => (
            <li key={x.izquierda.id} className="correcta">
              {x.izquierda.texto} ↔ {x.derecha.texto}
            </li>
          ))}
        </ul>
      );
      break;
    case 'CLASSIFICATION':
      contenido = (
        <ul>
          {c.categorias.map((cat) => (
            <li key={cat.id}>
              <b>{cat.nombre}:</b>{' '}
              {c.elementos
                .filter((e) => e.categoria === cat.id)
                .map((e) => e.texto)
                .join(', ')}
            </li>
          ))}
        </ul>
      );
      break;
    default:
      contenido = (
        <ul>
          {p.opciones.map((o) => (
            <li key={o} className={o === p.respuestaCorrecta ? 'correcta' : ''}>
              {o === p.respuestaCorrecta ? '✓ ' : ''}
              {o}
            </li>
          ))}
        </ul>
      );
  }

  return (
    <li>
      <span className="chip-tipo" title={TIPOS[tipo].nombre}>
        {TIPOS[tipo].icono} {TIPOS[tipo].nombre}
      </span>{' '}
      <strong>{p.enunciado}</strong>
      {p.puntos > 1 && <span className="texto-suave"> · {p.puntos} puntos</span>}
      {contenido}
    </li>
  );
}
