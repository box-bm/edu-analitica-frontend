// Política de contraseñas del backend (usuarios.schema.ts). Solo aplica al
// crear o cambiar una contraseña: el login NO la valida, porque las cuentas
// existentes pueden tener contraseñas viejas más cortas. UX solamente — el
// backend revalida y responde 400 con `errores.password`.
export const MIN_PASSWORD = 10;
export const MAX_PASSWORD_BYTES = 72; // bcrypt ignora lo que pase de 72 bytes

const bytes = (texto) => new TextEncoder().encode(texto).length;

export const REGLAS_PASSWORD = [
  { id: 'largo', texto: `Al menos ${MIN_PASSWORD} caracteres`, cumple: (p) => p.length >= MIN_PASSWORD },
  { id: 'letra', texto: 'Al menos una letra', cumple: (p) => /\p{L}/u.test(p) },
  { id: 'numero', texto: 'Al menos un número', cumple: (p) => /\d/.test(p) },
  // Acentos y ñ ocupan 2 bytes en UTF-8: el límite no es de caracteres.
  { id: 'bytes', texto: 'Sin pasarse de 72 bytes (los acentos y la ñ cuentan doble)', cumple: (p) => bytes(p) <= MAX_PASSWORD_BYTES },
  {
    id: 'usuario',
    texto: 'Distinta del nombre de usuario',
    cumple: (p, usuario) => !usuario || p.toLowerCase() !== usuario.trim().toLowerCase(),
  },
];

const MENSAJES = {
  largo: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`,
  letra: 'La contraseña debe incluir al menos una letra',
  numero: 'La contraseña debe incluir al menos un número',
  bytes: `La contraseña no puede superar ${MAX_PASSWORD_BYTES} bytes`,
  usuario: 'La contraseña no puede ser igual al usuario',
};

/** @returns {string[]} errores; vacío si la contraseña cumple la política. */
export function validarPassword(password, usuario = '') {
  return REGLAS_PASSWORD.filter((r) => !r.cumple(password, usuario)).map((r) => MENSAJES[r.id]);
}
