import { useLayoutEffect, useRef, useState } from 'react';

// Un color por pareja, para seguir cada línea con la vista.
const COLORES = ['var(--orange)', 'var(--teal)', 'var(--grape)', 'var(--sky)', 'var(--leaf)'];

// Dos columnas: se toca un elemento de un lado y luego uno del otro, y se
// dibuja una línea (SVG encima del contenedor). Tocar un elemento ya unido
// (sin otro elegido) suelta esa pareja. Cada elemento queda en una sola pareja.
export default function Relacionar({ pregunta, respuesta, onResponder }) {
  const { izquierda, derecha } = pregunta.configuracion;
  const parejas = respuesta ?? [];
  const [elegido, setElegido] = useState(null); // { lado, id }
  const [lineas, setLineas] = useState([]);
  const contenedor = useRef(null);
  const nodos = useRef(new Map());

  const colorDe = (idIzquierda) => COLORES[izquierda.findIndex((x) => x.id === idIzquierda) % COLORES.length];
  const parejaDe = (lado, id) => parejas.find((p) => p[lado] === id);

  const tocar = (lado, id) => {
    // Con un elemento del otro lado elegido: se unen (si alguno ya tenía
    // pareja, esa se suelta).
    if (elegido && elegido.lado !== lado) {
      const nueva = lado === 'izquierda' ? { izquierda: id, derecha: elegido.id } : { izquierda: elegido.id, derecha: id };
      onResponder([...parejas.filter((p) => p.izquierda !== nueva.izquierda && p.derecha !== nueva.derecha), nueva]);
      setElegido(null);
      return;
    }
    const existente = parejaDe(lado, id);
    if (existente) {
      onResponder(parejas.filter((p) => p !== existente));
      setElegido({ lado, id });
      return;
    }
    setElegido(elegido?.id === id ? null : { lado, id });
  };

  // Las coordenadas salen del DOM ya pintado; se recalculan si cambia el tamaño.
  useLayoutEffect(() => {
    const medir = () => {
      const caja = contenedor.current?.getBoundingClientRect();
      if (!caja) return;
      setLineas(
        parejas
          .map((p) => {
            const a = nodos.current.get(`izquierda:${p.izquierda}`)?.getBoundingClientRect();
            const b = nodos.current.get(`derecha:${p.derecha}`)?.getBoundingClientRect();
            if (!a || !b) return null;
            return {
              id: `${p.izquierda}-${p.derecha}`,
              color: colorDe(p.izquierda),
              x1: a.right - caja.left,
              y1: a.top + a.height / 2 - caja.top,
              x2: b.left - caja.left,
              y2: b.top + b.height / 2 - caja.top,
            };
          })
          .filter(Boolean)
      );
    };
    medir();
    const observador = new ResizeObserver(medir);
    if (contenedor.current) observador.observe(contenedor.current);
    return () => observador.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [respuesta]);

  const columna = (lado, items) => (
    <ul className={`relacion-columna relacion-${lado}`}>
      {items.map((item) => {
        const pareja = parejaDe(lado, item.id);
        const color = pareja ? colorDe(pareja.izquierda) : undefined;
        const activo = elegido?.lado === lado && elegido.id === item.id;
        return (
          <li key={item.id}>
            <button
              ref={(nodo) => {
                const clave = `${lado}:${item.id}`;
                if (nodo) nodos.current.set(clave, nodo);
                else nodos.current.delete(clave);
              }}
              className={`relacion-item ${pareja ? 'unido' : ''} ${activo ? 'activo' : ''}`}
              style={color ? { '--par': color } : undefined}
              onClick={() => tocar(lado, item.id)}
              aria-pressed={activo || Boolean(pareja)}
            >
              <span className="relacion-texto">{item.texto}</span>
              <span className="relacion-punto" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="relacion" ref={contenedor}>
      <svg className="relacion-lineas" aria-hidden="true">
        {lineas.map((l) => (
          <g key={l.id}>
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="white" strokeWidth="11" strokeLinecap="round" />
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.color} strokeWidth="6" strokeLinecap="round" />
          </g>
        ))}
      </svg>
      {columna('izquierda', izquierda)}
      {columna('derecha', derecha)}
      <p className="relacion-estado" aria-live="polite">
        {parejas.length} de {izquierda.length} unidos
      </p>
    </div>
  );
}
