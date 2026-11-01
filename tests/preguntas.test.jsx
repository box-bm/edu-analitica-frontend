import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import RenderizadorPregunta from '../src/components/preguntas/RenderizadorPregunta';
import { estaRespondida } from '../src/components/preguntas/tipos';
import Resultado from '../src/pages/estudiante/Resultado';

// jsdom no trae ResizeObserver (lo usa Relacionar para redibujar las líneas).
globalThis.ResizeObserver ??= class {
  observe() {}
  disconnect() {}
};

const imagen = {
  id: 2,
  tipo: 'IMAGE_CHOICE',
  enunciado: '¿Cuál tiene 5?',
  configuracion: {
    opciones: [
      { id: 'a1', imagen: 'assets/actividades/matematica/manzanas-3.svg', texto: null },
      { id: 'b2', imagen: 'assets/actividades/matematica/manzanas-5.svg', texto: 'Cinco' },
    ],
  },
};
const orden = {
  id: 3,
  tipo: 'ORDERING',
  enunciado: 'Ordena',
  configuracion: { elementos: [{ id: 'x3', texto: '3' }, { id: 'x1', texto: '1' }, { id: 'x2', texto: '2' }] },
};
const relacion = {
  id: 4,
  tipo: 'MATCHING',
  enunciado: 'Une',
  configuracion: {
    izquierda: [{ id: 'i1', texto: '2 + 2' }, { id: 'i2', texto: '3 + 3' }, { id: 'i3', texto: '5 + 2' }],
    derecha: [{ id: 'd6', texto: '6' }, { id: 'd7', texto: '7' }, { id: 'd4', texto: '4' }],
  },
};
const clasificacion = {
  id: 5,
  tipo: 'CLASSIFICATION',
  enunciado: 'Clasifica',
  configuracion: {
    categorias: [{ id: 'ce', nombre: 'Entrada' }, { id: 'cs', nombre: 'Salida' }],
    elementos: [{ id: 'm', texto: 'Mouse' }, { id: 'mo', texto: 'Monitor' }, { id: 't', texto: 'Teclado' }],
  },
};

// Igual que Actividad: el padre guarda la respuesta de la pregunta.
function Pregunta({ pregunta, onCambio = () => {} }) {
  const [respuesta, setRespuesta] = useState(undefined);
  return (
    <RenderizadorPregunta
      pregunta={pregunta}
      respuesta={respuesta}
      onResponder={(r) => {
        setRespuesta(r);
        onCambio(r);
      }}
    />
  );
}

describe('RenderizadorPregunta', () => {
  it('keeps old questions without tipo as multiple choice', async () => {
    const onCambio = vi.fn();
    render(<Pregunta pregunta={{ id: 1, enunciado: '¿2 + 3?', opciones: ['4', '5'] }} onCambio={onCambio} />);
    await userEvent.click(screen.getByRole('button', { name: /5/ }));
    expect(onCambio).toHaveBeenLastCalledWith('5');
    expect(screen.getByRole('button', { name: /5/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('answers image choice with the option id and marks the selected card', async () => {
    const onCambio = vi.fn();
    render(<Pregunta pregunta={imagen} onCambio={onCambio} />);
    const cinco = screen.getByRole('button', { name: 'B: Cinco' });
    expect(cinco.querySelector('img').getAttribute('src')).toMatch(/assets\/actividades\/matematica\/manzanas-5\.svg$/);

    await userEvent.click(cinco);

    expect(onCambio).toHaveBeenLastCalledWith('b2');
    expect(cinco).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Imagen A' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows ordering cards in the order the server sent, numbered by position', () => {
    render(<Pregunta pregunta={orden} />);
    const tarjetas = screen.getAllByRole('button', { name: /posición/ });
    expect(tarjetas.map((t) => t.getAttribute('aria-label'))).toEqual([
      '3, posición 1',
      '1, posición 2',
      '2, posición 3',
    ]);
  });

  it('links one item from each column, and untying a linked item frees both', async () => {
    const onCambio = vi.fn();
    render(<Pregunta pregunta={relacion} onCambio={onCambio} />);

    await userEvent.click(screen.getByRole('button', { name: '2 + 2' }));
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    expect(onCambio).toHaveBeenLastCalledWith([{ izquierda: 'i1', derecha: 'd4' }]);
    expect(screen.getByText('1 de 3 unidos')).toBeInTheDocument();

    // Desde la derecha también se puede empezar.
    await userEvent.click(screen.getByRole('button', { name: '6' }));
    await userEvent.click(screen.getByRole('button', { name: '3 + 3' }));
    expect(onCambio).toHaveBeenLastCalledWith([
      { izquierda: 'i1', derecha: 'd4' },
      { izquierda: 'i2', derecha: 'd6' },
    ]);

    // Un elemento no queda en dos parejas: reasignar "4" suelta la anterior.
    await userEvent.click(screen.getByRole('button', { name: '5 + 2' }));
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    expect(onCambio).toHaveBeenLastCalledWith([
      { izquierda: 'i2', derecha: 'd6' },
      { izquierda: 'i3', derecha: 'd4' },
    ]);
  });

  it('removes a pair when a linked item is tapped again', async () => {
    const onCambio = vi.fn();
    render(<Pregunta pregunta={relacion} onCambio={onCambio} />);
    await userEvent.click(screen.getByRole('button', { name: '2 + 2' }));
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    expect(onCambio).toHaveBeenLastCalledWith([]);
  });

  it('classifies by tapping a card and then a group, and can send it back', async () => {
    const onCambio = vi.fn();
    render(<Pregunta pregunta={clasificacion} onCambio={onCambio} />);

    await userEvent.click(screen.getByRole('button', { name: 'Mouse' }));
    await userEvent.click(screen.getByRole('group', { name: 'Entrada' }));
    expect(onCambio).toHaveBeenLastCalledWith([{ elemento: 'm', categoria: 'ce' }]);

    await userEvent.click(screen.getByRole('button', { name: 'Mouse' }));
    await userEvent.click(screen.getByRole('group', { name: 'Tarjetas por clasificar' }));
    expect(onCambio).toHaveBeenLastCalledWith([]);
  });
});

describe('estaRespondida', () => {
  it('requires a complete answer for each tipo', () => {
    expect(estaRespondida(imagen, undefined)).toBe(false);
    expect(estaRespondida(imagen, 'a1')).toBe(true);
    expect(estaRespondida(orden, undefined)).toBe(false);
    expect(estaRespondida(orden, ['x1', 'x2', 'x3'])).toBe(true);
    expect(estaRespondida(relacion, [{ izquierda: 'i1', derecha: 'd4' }])).toBe(false);
    expect(estaRespondida(clasificacion, [{}, {}, {}])).toBe(true);
  });
});

describe('Resultado', () => {
  it('shows aciertos, porcentaje, puntos, 5 estrellas, intento and the way back', () => {
    const actividad = { id: 9, modulo: { id: 1 }, preguntas: [orden, relacion] };
    const resultado = {
      puntaje: 1,
      puntajeTotal: 2,
      puntosObtenidos: 83,
      puntosPosibles: 100,
      intento: 2,
      detalle: [
        { idPregunta: 3, tipo: 'ORDERING', esCorrecta: false, aciertos: 2, total: 3, respuestaCorrecta: ['x1', 'x2', 'x3'] },
        { idPregunta: 4, tipo: 'MATCHING', esCorrecta: true, aciertos: 3, total: 3, respuestaCorrecta: [{ izquierda: 'i1', derecha: 'd4' }] },
      ],
    };
    render(
      <MemoryRouter initialEntries={[{ pathname: '/grupo/resultado', state: { resultado, actividad } }]}>
        <Routes>
          <Route path="/grupo/resultado" element={<Resultado />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('✓ Actividad completada')).toBeInTheDocument();
    expect(screen.getByText('Aciertos').nextSibling).toHaveTextContent('1 de 2');
    expect(screen.getByText('Resultado').nextSibling).toHaveTextContent('83 %');
    expect(screen.getByText('Puntos').nextSibling).toHaveTextContent('83 / 100');
    expect(screen.getByText('Intento').nextSibling).toHaveTextContent('2');
    expect(screen.getByRole('img', { name: '4 de 5 estrellas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a actividades' })).toHaveAttribute('href', '/grupo/modulos/1');
    expect(screen.getByRole('link', { name: 'Volver a módulos' })).toHaveAttribute('href', '/grupo/modulos');
    // Repaso con los textos, no con ids.
    expect(screen.getByText(/Pusieron 2 de 3 en su lugar/)).toBeInTheDocument();
    expect(screen.getByText('2 + 2', { exact: false })).toBeInTheDocument();
  });
});
