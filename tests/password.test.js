import { describe, expect, it } from 'vitest';
import { validarPassword } from '../src/utils/password';

describe('validarPassword (política del backend)', () => {
  it('rejects 9 characters and accepts exactly 10', () => {
    expect(validarPassword('abcdefgh1', 'ana')).toEqual([
      'La contraseña debe tener al menos 10 caracteres',
    ]);
    expect(validarPassword('abcdefghi1', 'ana')).toEqual([]);
  });

  it('requires at least one number', () => {
    expect(validarPassword('soloLetrasAqui', 'ana')).toEqual([
      'La contraseña debe incluir al menos un número',
    ]);
  });

  it('requires at least one letter (accented letters count)', () => {
    expect(validarPassword('1234567890', 'ana')).toEqual([
      'La contraseña debe incluir al menos una letra',
    ]);
    expect(validarPassword('ñ123456789', 'ana')).toEqual([]);
  });

  it('counts bytes, not characters: ñ takes 2 bytes in UTF-8', () => {
    const justo = `${'ñ'.repeat(35)}12`; // 37 caracteres, 72 bytes
    const pasado = `${'ñ'.repeat(36)}1`; // 37 caracteres, 73 bytes
    expect(validarPassword(justo, 'ana')).toEqual([]);
    expect(validarPassword(pasado, 'ana')).toEqual([
      'La contraseña no puede superar 72 bytes',
    ]);
  });

  it('rejects a password equal to the username, ignoring case', () => {
    expect(validarPassword('Docente2026', 'docente2026')).toEqual([
      'La contraseña no puede ser igual al usuario',
    ]);
  });

  it('returns every broken rule at once', () => {
    expect(validarPassword('', 'ana')).toHaveLength(3);
  });
});
