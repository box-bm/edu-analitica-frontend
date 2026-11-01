import { describe, expect, it } from 'vitest';
import { MENSAJES, estrellas, estrellasPorPorcentaje } from '../src/utils/estrellas';

describe('estrellas', () => {
  it('never returns fewer than 1 star, even with 0 correct', () => {
    expect(estrellas(0, 5)).toBe(1);
    expect(estrellas(0, 0)).toBe(1);
    expect(estrellasPorPorcentaje(0)).toBe(1);
  });

  it('uses the 5-star thresholds of the result screen', () => {
    expect([39, 40, 59, 60, 79, 80, 89, 90, 100].map(estrellasPorPorcentaje)).toEqual([1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  it('scales with the share of correct answers', () => {
    expect(estrellas(3, 5)).toBe(3);
    expect(estrellas(4, 5)).toBe(4);
    expect(estrellas(5, 5)).toBe(5);
    expect(estrellas(80, 100)).toBe(4);
  });

  it('has a message for every star count, with no failure-sounding wording', () => {
    expect(Object.keys(MENSAJES).sort()).toEqual(['1', '2', '3', '4', '5']);
    const texto = Object.values(MENSAJES)
      .map((m) => `${m.titulo} ${m.texto}`)
      .join(' ')
      .toLowerCase();
    for (const palabra of ['reprob', 'perdi', 'mal', 'fall', 'incorrect', 'error']) {
      expect(texto).not.toContain(palabra);
    }
  });
});
