export const MAX_URL_PDF = 500;

// Link http(s) bien formado. No exige que sea de Google Drive, pero sí
// descarta `javascript:` y compañía: se va a renderizar como enlace.
// El backend valida lo mismo; esto es solo para avisar antes de enviar.
export function esUrlPdfValida(texto) {
  const valor = texto.trim();
  if (!valor || valor.length > MAX_URL_PDF) return false;
  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
