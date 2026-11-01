import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function Tarjeta({ elemento, posicion }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: elemento.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`orden-tarjeta ${isDragging ? 'hueco' : ''}`}
      {...attributes}
      {...listeners}
      aria-label={`${elemento.texto}, posición ${posicion}`}
    >
      <span className="orden-posicion">{posicion}</span>
      <span className="orden-texto">{elemento.texto}</span>
      <span className="orden-asa" aria-hidden="true">
        ⠿
      </span>
    </li>
  );
}

// Arrastrar y soltar con mouse, dedo o teclado (espacio para levantar,
// flechas para mover). Mientras no se toca, se muestra el orden mezclado que
// mandó el servidor; la respuesta es la lista de ids en el orden elegido.
export default function Ordenar({ pregunta, respuesta, onResponder }) {
  const elementos = pregunta.configuracion.elementos;
  const porId = new Map(elementos.map((e) => [e.id, e]));
  const orden = respuesta ?? elementos.map((e) => e.id);
  const [arrastrando, setArrastrando] = useState(null);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const alSoltar = ({ active, over }) => {
    setArrastrando(null);
    if (!over) return;
    const desde = orden.indexOf(active.id);
    const hasta = orden.indexOf(over.id);
    onResponder(desde === hasta ? [...orden] : arrayMove(orden, desde, hasta));
  };

  const cortos = elementos.every((e) => e.texto.length <= 4);

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setArrastrando(active.id)}
      onDragEnd={alSoltar}
      onDragCancel={() => setArrastrando(null)}
    >
      <SortableContext items={orden} strategy={rectSortingStrategy}>
        <ol className={`orden-lista ${cortos ? 'orden-cortos' : ''}`}>
          {orden.map((id, i) => (
            <Tarjeta key={id} elemento={porId.get(id)} posicion={i + 1} />
          ))}
        </ol>
      </SortableContext>
      <DragOverlay>
        {arrastrando && (
          // Dentro de la misma clase de lista, para que conserve su forma.
          <div className={cortos ? 'orden-cortos' : ''}>
            <div className="orden-tarjeta levantada">
              <span className="orden-posicion">↕</span>
              <span className="orden-texto">{porId.get(arrastrando).texto}</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
