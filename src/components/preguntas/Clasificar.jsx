import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

const BANDEJA = 'bandeja';
const COLORES = ['teal', 'orange', 'grape'];

function Tarjeta({ elemento, elegida, onTocar }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: elemento.id });
  return (
    <button
      ref={setNodeRef}
      className={`clasif-tarjeta ${isDragging ? 'hueco' : ''} ${elegida ? 'elegida' : ''}`}
      onClick={onTocar}
      {...attributes}
      {...listeners}
    >
      {elemento.texto}
    </button>
  );
}

function Zona({ id, className, children, onTocar, etiqueta }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'encima' : ''}`}
      onClick={onTocar}
      role="group"
      aria-label={etiqueta}
    >
      {children}
    </div>
  );
}

// Se arrastran las tarjetas a su grupo, o se toca una tarjeta y luego el
// grupo (útil en pantallas táctiles pequeñas). Se puede devolver a la bandeja.
export default function Clasificar({ pregunta, respuesta, onResponder }) {
  const { categorias, elementos } = pregunta.configuracion;
  const asignaciones = respuesta ?? [];
  const [elegida, setElegida] = useState(null);
  const [arrastrando, setArrastrando] = useState(null);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const categoriaDe = (idElemento) => asignaciones.find((a) => a.elemento === idElemento)?.categoria ?? BANDEJA;

  const mover = (idElemento, destino) => {
    const resto = asignaciones.filter((a) => a.elemento !== idElemento);
    onResponder(destino === BANDEJA ? resto : [...resto, { elemento: idElemento, categoria: destino }]);
    setElegida(null);
  };

  const tarjetas = (destino) =>
    elementos
      .filter((e) => categoriaDe(e.id) === destino)
      .map((e) => (
        <Tarjeta
          key={e.id}
          elemento={e}
          elegida={elegida === e.id}
          onTocar={(ev) => {
            ev.stopPropagation();
            setElegida(elegida === e.id ? null : e.id);
          }}
        />
      ));

  const tocarZona = (destino) => {
    if (elegida) mover(elegida, destino);
  };

  const pendientes = elementos.filter((e) => categoriaDe(e.id) === BANDEJA).length;

  return (
    <DndContext
      sensors={sensores}
      onDragStart={({ active }) => setArrastrando(active.id)}
      onDragEnd={({ active, over }) => {
        setArrastrando(null);
        if (over) mover(active.id, over.id);
      }}
      onDragCancel={() => setArrastrando(null)}
    >
      <Zona
        id={BANDEJA}
        className={`clasif-bandeja ${pendientes === 0 ? 'vacia' : ''}`}
        onTocar={() => tocarZona(BANDEJA)}
        etiqueta="Tarjetas por clasificar"
      >
        {pendientes === 0 ? <span className="clasif-listo">¡Todas en su lugar! 🎉</span> : tarjetas(BANDEJA)}
      </Zona>

      <div className={`clasif-categorias clasif-${categorias.length}`}>
        {categorias.map((c, i) => (
          <Zona
            key={c.id}
            id={c.id}
            className={`clasif-categoria color-${COLORES[i % COLORES.length]} ${elegida ? 'esperando' : ''}`}
            onTocar={() => tocarZona(c.id)}
            etiqueta={c.nombre}
          >
            <h3>{c.nombre}</h3>
            <div className="clasif-contenido">{tarjetas(c.id)}</div>
          </Zona>
        ))}
      </div>

      <DragOverlay>
        {arrastrando && (
          <div className="clasif-tarjeta levantada">{elementos.find((e) => e.id === arrastrando)?.texto}</div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
