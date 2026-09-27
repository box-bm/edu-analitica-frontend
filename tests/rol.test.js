import { describe, expect, it } from 'vitest';
import { nombreRol } from '../src/utils/rol';

describe('nombreRol', () => {
  it('returns the string rol the backend sends', () => {
    expect(nombreRol('docente')).toBe('docente');
  });

  it('still reads the old { id, nombreRol } shape', () => {
    expect(nombreRol({ id: 1, nombreRol: 'administrador' })).toBe('administrador');
  });

  it('is undefined without a rol', () => {
    expect(nombreRol(undefined)).toBeUndefined();
  });
});
