import { describe, expect, it } from 'vitest';
import { aApi, desdeApi, preguntaVacia, validar } from '../src/pages/docente/actividades/formato';

const form = (preguntas) => ({ idModulo: '1', titulo: 'Repaso', preguntas });

describe('formulario de actividad', () => {
  it('sends each tipo in the shape the backend validates', () => {
    const mc = { ...preguntaVacia(), enunciado: ' ¿2+3? ', opciones: ['4', ' 5 '], correcta: 1 };
    const img = {
      ...preguntaVacia('IMAGE_CHOICE'),
      enunciado: '¿Cuál?',
      puntos: 2,
      imagenes: [
        { imagen: 'assets/a.svg', texto: '' },
        { imagen: 'imagenes/0b7c6f1e-2a4d-4c3b-9f8e-1a2b3c4d5e6f', texto: 'Cinco' },
      ],
      imagenCorrecta: 1,
    };
    const ord = { ...preguntaVacia('ORDERING'), enunciado: 'Ordena', elementos: ['1', '2', '3'] };
    const rel = {
      ...preguntaVacia('MATCHING'),
      enunciado: 'Une',
      pares: [
        { izquierda: 'a', derecha: '1' },
        { izquierda: 'b', derecha: '2' },
        { izquierda: 'c', derecha: '3' },
      ],
    };
    const cla = {
      ...preguntaVacia('CLASSIFICATION'),
      enunciado: 'Clasifica',
      categorias: ['Par', 'Impar'],
      clasificables: [
        { texto: '2', categoria: 0 },
        { texto: '3', categoria: 1 },
        { texto: '4', categoria: 0 },
      ],
    };

    expect(aApi([mc, img, ord, rel, cla])).toEqual([
      { tipo: 'MULTIPLE_CHOICE', enunciado: '¿2+3?', puntos: 1, opciones: ['4', '5'], respuestaCorrecta: '5' },
      {
        tipo: 'IMAGE_CHOICE',
        enunciado: '¿Cuál?',
        puntos: 2,
        configuracion: {
          opciones: [
            { imagen: 'assets/a.svg', texto: null, correcta: false },
            { imagen: 'imagenes/0b7c6f1e-2a4d-4c3b-9f8e-1a2b3c4d5e6f', texto: 'Cinco', correcta: true },
          ],
        },
      },
      { tipo: 'ORDERING', enunciado: 'Ordena', puntos: 1, configuracion: { elementos: [{ texto: '1' }, { texto: '2' }, { texto: '3' }] } },
      {
        tipo: 'MATCHING',
        enunciado: 'Une',
        puntos: 1,
        configuracion: { pares: [{ izquierda: 'a', derecha: '1' }, { izquierda: 'b', derecha: '2' }, { izquierda: 'c', derecha: '3' }] },
      },
      {
        tipo: 'CLASSIFICATION',
        enunciado: 'Clasifica',
        puntos: 1,
        configuracion: {
          categorias: [{ nombre: 'Par' }, { nombre: 'Impar' }],
          elementos: [{ texto: '2', categoria: 0 }, { texto: '3', categoria: 1 }, { texto: '4', categoria: 0 }],
        },
      },
    ]);
    expect(validar(form([mc, img, ord, rel, cla]))).toBeNull();
  });

  it('reads back what the docente endpoint returns (with server ids) without changes', () => {
    const desdeServidor = [
      { tipo: 'MULTIPLE_CHOICE', enunciado: '¿2+3?', opciones: ['4', '5'], respuestaCorrecta: '5', puntos: 1 },
      {
        tipo: 'CLASSIFICATION',
        enunciado: 'Clasifica',
        puntos: 3,
        configuracion: {
          categorias: [{ id: 'k1', nombre: 'Par' }, { id: 'k2', nombre: 'Impar' }],
          elementos: [{ id: 'e1', texto: '2', categoria: 'k1' }, { id: 'e2', texto: '3', categoria: 'k2' }, { id: 'e3', texto: '4', categoria: 'k1' }],
        },
      },
      {
        tipo: 'MATCHING',
        enunciado: 'Une',
        puntos: 1,
        configuracion: {
          pares: [
            { izquierda: { id: 'a', texto: 'x' }, derecha: { id: 'b', texto: '1' } },
            { izquierda: { id: 'c', texto: 'y' }, derecha: { id: 'd', texto: '2' } },
            { izquierda: { id: 'e', texto: 'z' }, derecha: { id: 'f', texto: '3' } },
          ],
        },
      },
    ];
    const enviado = aApi(desdeApi(desdeServidor));
    expect(enviado[1].configuracion.elementos.map((e) => e.categoria)).toEqual([0, 1, 0]);
    expect(enviado[1].puntos).toBe(3);
    expect(enviado[2].configuracion.pares[0]).toEqual({ izquierda: 'x', derecha: '1' });
    // Sin cambios, el editor no reenvía preguntas (evita el 409 de actividades ya resueltas).
    expect(JSON.stringify(aApi(desdeApi(desdeServidor)))).toBe(JSON.stringify(enviado));
  });

  it.each([
    [{ ...preguntaVacia('IMAGE_CHOICE'), enunciado: 'x', imagenCorrecta: 0 }, 'La pregunta 1 falta elegir alguna imagen.'],
    [{ ...preguntaVacia('ORDERING'), enunciado: 'x', elementos: ['1', '1', '2'] }, 'La pregunta 1 tiene elementos repetidos.'],
    [{ ...preguntaVacia('MATCHING'), enunciado: 'x' }, 'La pregunta 1 tiene parejas incompletas.'],
    [{ ...preguntaVacia('CLASSIFICATION'), enunciado: 'x', categorias: ['A', 'A'] }, 'La pregunta 1 tiene grupos repetidos.'],
    [{ ...preguntaVacia(), enunciado: 'x', opciones: ['1', '2'], puntos: 11, correcta: 0 }, 'La pregunta 1 los puntos van de 1 a 10.'],
  ])('explains what is missing before sending (%#)', (pregunta, mensaje) => {
    expect(validar(form([pregunta]))).toBe(mensaje);
  });
});
