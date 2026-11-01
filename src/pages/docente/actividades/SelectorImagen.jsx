import { useEffect, useState } from 'react';
import imagenesService from '../../../services/imagenesService';
import { comprimirImagen } from '../../../utils/comprimirImagen';
import { CATALOGO_IMAGENES, urlImagen } from '../../../utils/imagenes';

// Panel para elegir la imagen de una opción: del catálogo incluido en el
// sistema (sin costo, sin subir nada) o de las que el docente subió. Las
// subidas se comprimen en el navegador y se guardan en la base del backend.
export default function SelectorImagen({ valor, onElegir, onCerrar }) {
  const [pestana, setPestana] = useState(valor?.startsWith('imagenes/') ? 'mias' : 'catalogo');
  const [mias, setMias] = useState(null);
  const [error, setError] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    if (pestana !== 'mias' || mias) return;
    let cancelado = false;
    imagenesService.listar().then((r) => {
      if (cancelado) return;
      if (r.success) setMias(r.data);
      else setError(r.error);
    });
    return () => {
      cancelado = true;
    };
  }, [pestana, mias]);

  const subir = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setError(null);
    setSubiendo(true);
    try {
      const blob = await comprimirImagen(archivo);
      const nombre = archivo.name.replace(/\.[^.]+$/, '').slice(0, 100);
      const r = await imagenesService.subir(blob, nombre);
      if (!r.success) {
        setError(r.error);
        return;
      }
      setMias((lista) => [r.data, ...(lista ?? [])]);
      onElegir(r.data.ruta);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const borrar = async (imagen) => {
    setError(null);
    const r = await imagenesService.eliminar(imagen.id);
    if (r.success) setMias((lista) => lista.filter((i) => i.id !== imagen.id));
    else setError(r.error);
  };

  const miniatura = (ruta, nombre, extra = null) => (
    <div key={ruta} className={`selector-miniatura ${valor === ruta ? 'elegida' : ''}`}>
      <button type="button" onClick={() => onElegir(ruta)} aria-pressed={valor === ruta} title={nombre}>
        <img src={urlImagen(ruta)} alt="" loading="lazy" />
        <span>{nombre}</span>
      </button>
      {extra}
    </div>
  );

  return (
    <div className="selector-imagen">
      <div className="selector-imagen-top">
        <div className="pestanas" role="group" aria-label="Origen de la imagen">
          <button type="button" aria-pressed={pestana === 'catalogo'} onClick={() => setPestana('catalogo')}>
            Catálogo del sistema
          </button>
          <button type="button" aria-pressed={pestana === 'mias'} onClick={() => setPestana('mias')}>
            Mis imágenes
          </button>
        </div>
        <button type="button" className="btn-ghost btn-sm" onClick={onCerrar}>
          Listo
        </button>
      </div>

      {pestana === 'catalogo' ? (
        CATALOGO_IMAGENES.map((g) => (
          <div key={g.grupo}>
            <h5>{g.grupo}</h5>
            <div className="selector-grid">{g.imagenes.map((i) => miniatura(i.ruta, i.nombre))}</div>
          </div>
        ))
      ) : (
        <>
          <p className="texto-suave selector-aviso">
            🔒 Usa dibujos u objetos. No subas fotos de estudiantes. Se reducen a 600 px antes de subirlas (máx.
            200 KB).
          </p>
          <label className={`btn-teal btn-sm selector-subir ${subiendo ? 'deshabilitado' : ''}`}>
            {subiendo ? 'Subiendo…' : '⬆ Subir imagen'}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={subir} disabled={subiendo} hidden />
          </label>
          {mias === null && !error ? (
            <p className="cargando">Cargando tus imágenes…</p>
          ) : mias?.length === 0 ? (
            <p className="texto-suave">Todavía no has subido imágenes.</p>
          ) : (
            <div className="selector-grid">
              {mias?.map((i) =>
                miniatura(
                  i.ruta,
                  i.nombre,
                  <button
                    type="button"
                    className="selector-borrar"
                    onClick={() => borrar(i)}
                    aria-label={`Borrar ${i.nombre}`}
                  >
                    ✕
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
