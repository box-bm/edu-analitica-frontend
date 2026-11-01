const LETRAS = ['A', 'B', 'C', 'D'];

export default function SeleccionMultiple({ pregunta, respuesta, onResponder }) {
  return (
    <div className={`opciones opciones-${pregunta.opciones.length}`}>
      {pregunta.opciones.map((opcion, i) => (
        <button
          key={opcion}
          className={`opcion opcion-${i} ${respuesta === opcion ? 'elegida' : ''}`}
          onClick={() => onResponder(opcion)}
          aria-pressed={respuesta === opcion}
        >
          <span className="opcion-letra">{LETRAS[i]}</span>
          <span className="opcion-texto">{opcion}</span>
        </button>
      ))}
    </div>
  );
}
