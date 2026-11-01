import { urlImagen } from '../../utils/imagenes';

const LETRAS = ['A', 'B', 'C', 'D'];

export default function SeleccionImagen({ pregunta, respuesta, onResponder }) {
  const { opciones } = pregunta.configuracion;

  return (
    <div className={`opciones-imagen opciones-imagen-${opciones.length}`}>
      {opciones.map((opcion, i) => {
        const elegida = respuesta === opcion.id;
        return (
          <button
            key={opcion.id}
            className={`opcion-imagen opcion-${i} ${elegida ? 'elegida' : ''}`}
            onClick={() => onResponder(opcion.id)}
            aria-pressed={elegida}
            aria-label={opcion.texto ? `${LETRAS[i]}: ${opcion.texto}` : `Imagen ${LETRAS[i]}`}
          >
            <span className="opcion-letra">{LETRAS[i]}</span>
            {elegida && (
              <span className="opcion-imagen-check" aria-hidden="true">
                ✓
              </span>
            )}
            <img src={urlImagen(opcion.imagen)} alt="" draggable="false" />
            {opcion.texto && <span className="opcion-imagen-texto">{opcion.texto}</span>}
          </button>
        );
      })}
    </div>
  );
}
