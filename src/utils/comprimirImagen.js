// Reduce una imagen en el navegador antes de subirla: lado mayor de 600 px y
// WebP (JPEG si el navegador no codifica WebP), bajando la calidad hasta que
// quepa en el límite del backend. Así cada imagen pesa decenas de KB en la
// base de datos en vez de megas.
export const MAX_BYTES = 200 * 1024;
const LADO_MAXIMO = 600;

function cargar(archivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

const aBlob = (canvas, tipo, calidad) => new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad));

export async function comprimirImagen(archivo) {
  if (!archivo.type.startsWith('image/')) throw new Error('El archivo no es una imagen');

  const img = await cargar(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
  const ctx = canvas.getContext('2d');
  // Fondo blanco: un PNG transparente convertido a JPEG quedaría negro.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  for (const calidad of [0.85, 0.7, 0.55, 0.4]) {
    let blob = await aBlob(canvas, 'image/webp', calidad);
    if (!blob || blob.type !== 'image/webp') blob = await aBlob(canvas, 'image/jpeg', calidad);
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error('La imagen sigue siendo muy pesada. Prueba con una más sencilla.');
}
