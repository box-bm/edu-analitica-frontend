import { describe, expect, it } from 'vitest';
import { MENSAJES, estrellas } from '../src/utils/estrellas';

describe('estrellas', () => {
  it('never returns fewer than 1 star, even with 0 correct', () => {
    expect(estrellas(0, 5)).toBe(1);
    expect(estrellas(0, 0)).toBe(1);
  });

  it('scales with the share of correct answers', () => {
    expect(estrellas(3, 5)).toBe(2);
    expect(estrellas(5, 5)).toBe(3);
    expect(estrellas(9, 10)).toBe(3);
  });

  it('uses no failure-sounding wording for kids', () => {
    const texto = Object.values(MENSAJES)
      .map((m) => `${m.titulo} ${m.texto}`)
      .join(' ')
      .toLowerCase();
    for (const palabra of ['reprob', 'perdi', 'mal', 'fall', 'incorrect', 'error']) {
      expect(texto).not.toContain(palabra);
    }
  });
});
