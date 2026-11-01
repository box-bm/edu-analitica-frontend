import { useState } from 'react';
import { TIPOS } from '../../../components/preguntas/tipos';
import { urlImagen } from '../../../utils/imagenes';
import { LIMITES } from './formato';
import SelectorImagen from './SelectorImagen';

// Lista de textos con agregar/quitar dentro de los límites del tipo.
function ListaTextos({ valores, onCambiar, min, max, placeholder, etiqueta, numerada = false }) {
  return (
    <div className="opciones-editor">
      {valores.map((v, i) => (
        <div key={i} className="opcion-editor">
          {numerada && <span className="orden-num">{i + 1}</span>}
          <input
            type="text"
            value={v}
            onChange={(e) => onCambiar(valores.map((x, j) => (j === i ? e.target.value : x)))}
            maxLength={60}
            placeholder={`${placeholder} ${i + 1}`}
            aria-label={`${etiqueta} ${i + 1}`}
          />
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => onCambiar(valores.filter((_, j) => j !== i))}
            disabled={valores.length <= min}
            aria-label={`Quitar ${etiqueta.toLowerCase()} ${i + 1}`}
          >
            ✕
          </button>
        </div>
      ))}
      {valores.length < max && (
        <button
          type="button"
          className="btn-ghost btn-sm"
          style={{ justifySelf: 'start' }}
          onClick={() => onCambiar([...valores, ''])}
        >
          + {etiqueta}
        </button>
      )}
    </div>
  );
}

function CamposSeleccionMultiple({ p, cambiar }) {
  const { min, max } = LIMITES.MULTIPLE_CHOICE;
  const quitarOpcion = (iOpcion) => {
    let correcta = p.correcta;
    if (correcta === iOpcion) correcta = null;
    else if (correcta !== null && correcta > iOpcion) correcta -= 1;
    cambiar({ opciones: p.opciones.filter((_, j) => j !== iOpcion), correcta });
  };

  return (
    <div className="opciones-editor">
      {p.opciones.map((o, iO) => (
        <div key={iO} className={`opcion-editor ${p.correcta === iO ? 'es-correcta' : ''}`}>
          <input
            type="text"
            value={o}
            onChange={(e) => cambiar({ opciones: p.opciones.map((x, i) => (i === iO ? e.target.value : x)) })}
            maxLength={100}
            placeholder={`Opción ${iO + 1}`}
            aria-label={`Opción ${iO + 1}`}
          />
          <label className="opcion-correcta">
            <input type="radio" checked={p.correcta === iO} onChange={() => cambiar({ correcta: iO })} />
            Correcta
          </label>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => quitarOpcion(iO)}
            disabled={p.opciones.length <= min}
            aria-label={`Quitar opción ${iO + 1}`}
          >
            ✕
          </button>
        </div>
      ))}
      {p.opciones.length < max && (
        <button
          type="button"
          className="btn-ghost btn-sm"
          style={{ justifySelf: 'start' }}
          onClick={() => cambiar({ opciones: [...p.opciones, ''] })}
        >
          + Opción
        </button>
      )}
    </div>
  );
}

function CamposSeleccionImagen({ p, cambiar }) {
  const { min, max } = LIMITES.IMAGE_CHOICE;
  const [eligiendo, setEligiendo] = useState(null);
  const actualizar = (i, cambios) =>
    cambiar({ imagenes: p.imagenes.map((o, j) => (j === i ? { ...o, ...cambios } : o)) });
  const quitar = (i) => {
    let imagenCorrecta = p.imagenCorrecta;
    if (imagenCorrecta === i) imagenCorrecta = null;
    else if (imagenCorrecta !== null && imagenCorrecta > i) imagenCorrecta -= 1;
    setEligiendo(null);
    cambiar({ imagenes: p.imagenes.filter((_, j) => j !== i), imagenCorrecta });
  };

  return (
    <div className="imagenes-editor">
      <div className="imagenes-editor-grid">
        {p.imagenes.map((o, i) => (
          <div key={i} className={`imagen-editor ${p.imagenCorrecta === i ? 'es-correcta' : ''}`}>
            <button
              type="button"
              className={`imagen-editor-vista ${eligiendo === i ? 'activa' : ''}`}
              onClick={() => setEligiendo(eligiendo === i ? null : i)}
            >
              {o.imagen ? <img src={urlImagen(o.imagen)} alt="" /> : <span>🖼️ Elegir imagen</span>}
            </button>
            <input
              type="text"
              value={o.texto}
              onChange={(e) => actualizar(i, { texto: e.target.value })}
              maxLength={60}
              placeholder="Texto debajo (opcional)"
              aria-label={`Texto de la imagen ${i + 1}`}
            />
            <div className="imagen-editor-pie">
              <label className="opcion-correcta">
                <input type="radio" checked={p.imagenCorrecta === i} onChange={() => cambiar({ imagenCorrecta: i })} />
                Correcta
              </label>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => quitar(i)}
                disabled={p.imagenes.length <= min}
                aria-label={`Quitar imagen ${i + 1}`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {p.imagenes.length < max && (
          <button
            type="button"
            className="imagen-editor-agregar"
            onClick={() => cambiar({ imagenes: [...p.imagenes, { imagen: null, texto: '' }] })}
          >
            + Imagen
          </button>
        )}
      </div>
      {eligiendo !== null && p.imagenes[eligiendo] && (
        <SelectorImagen
          valor={p.imagenes[eligiendo].imagen}
          onElegir={(ruta) => actualizar(eligiendo, { imagen: ruta })}
          onCerrar={() => setEligiendo(null)}
        />
      )}
    </div>
  );
}

function CamposRelacionar({ p, cambiar }) {
  const { min, max } = LIMITES.MATCHING;
  const actualizar = (i, cambios) => cambiar({ pares: p.pares.map((x, j) => (j === i ? { ...x, ...cambios } : x)) });

  return (
    <div className="opciones-editor">
      <div className="pares-cabecera">
        <span>Columna A</span>
        <span />
        <span>Columna B (se mezcla)</span>
      </div>
      {p.pares.map((x, i) => (
        <div key={i} className="opcion-editor par-editor">
          <input
            type="text"
            value={x.izquierda}
            onChange={(e) => actualizar(i, { izquierda: e.target.value })}
            maxLength={60}
            placeholder={`Ej: ${['2 + 2', 'Mouse', 'Enter', 'Ctrl + C', '3 × 4'][i] ?? 'Elemento'}`}
            aria-label={`Pareja ${i + 1}, columna A`}
          />
          <span className="par-flecha" aria-hidden="true">
            ↔
          </span>
          <input
            type="text"
            value={x.derecha}
            onChange={(e) => actualizar(i, { derecha: e.target.value })}
            maxLength={60}
            placeholder={`Ej: ${['4', 'Mover la flechita', 'Nueva línea', 'Copiar', '12'][i] ?? 'Su pareja'}`}
            aria-label={`Pareja ${i + 1}, columna B`}
          />
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => cambiar({ pares: p.pares.filter((_, j) => j !== i) })}
            disabled={p.pares.length <= min}
            aria-label={`Quitar pareja ${i + 1}`}
          >
            ✕
          </button>
        </div>
      ))}
      {p.pares.length < max && (
        <button
          type="button"
          className="btn-ghost btn-sm"
          style={{ justifySelf: 'start' }}
          onClick={() => cambiar({ pares: [...p.pares, { izquierda: '', derecha: '' }] })}
        >
          + Pareja
        </button>
      )}
    </div>
  );
}

function CamposClasificar({ p, cambiar }) {
  const { min, max, minCategorias, maxCategorias } = LIMITES.CLASSIFICATION;
  const quitarCategoria = (iC) =>
    cambiar({
      categorias: p.categorias.filter((_, j) => j !== iC),
      // Las tarjetas de ese grupo pasan al primero; las de grupos posteriores se corren.
      clasificables: p.clasificables.map((e) => ({
        ...e,
        categoria: e.categoria === iC ? 0 : e.categoria > iC ? e.categoria - 1 : e.categoria,
      })),
    });
  const actualizar = (i, cambios) =>
    cambiar({ clasificables: p.clasificables.map((x, j) => (j === i ? { ...x, ...cambios } : x)) });

  return (
    <div className="opciones-editor">
      <span className="subtitulo-editor">Grupos</span>
      <div className="categorias-editor">
        {p.categorias.map((c, i) => (
          <div key={i} className="opcion-editor">
            <input
              type="text"
              value={c}
              onChange={(e) => cambiar({ categorias: p.categorias.map((x, j) => (j === i ? e.target.value : x)) })}
              maxLength={40}
              placeholder={['Ej: Dispositivos de entrada', 'Ej: Dispositivos de salida', 'Otro grupo'][i]}
              aria-label={`Grupo ${i + 1}`}
            />
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => quitarCategoria(i)}
              disabled={p.categorias.length <= minCategorias}
              aria-label={`Quitar grupo ${i + 1}`}
            >
              ✕
            </button>
          </div>
        ))}
        {p.categorias.length < maxCategorias && (
          <button type="button" className="btn-ghost btn-sm" onClick={() => cambiar({ categorias: [...p.categorias, ''] })}>
            + Grupo
          </button>
        )}
      </div>

      <span className="subtitulo-editor">Tarjetas y su grupo correcto</span>
      {p.clasificables.map((e, i) => (
        <div key={i} className="opcion-editor">
          <input
            type="text"
            value={e.texto}
            onChange={(ev) => actualizar(i, { texto: ev.target.value })}
            maxLength={60}
            placeholder={`Tarjeta ${i + 1}`}
            aria-label={`Tarjeta ${i + 1}`}
          />
          <select
            className="form-field"
            value={e.categoria}
            onChange={(ev) => actualizar(i, { categoria: Number(ev.target.value) })}
            aria-label={`Grupo de la tarjeta ${i + 1}`}
          >
            {p.categorias.map((c, iC) => (
              <option key={iC} value={iC}>
                {c.trim() || `Grupo ${iC + 1}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => cambiar({ clasificables: p.clasificables.filter((_, j) => j !== i) })}
            disabled={p.clasificables.length <= min}
            aria-label={`Quitar tarjeta ${i + 1}`}
          >
            ✕
          </button>
        </div>
      ))}
      {p.clasificables.length < max && (
        <button
          type="button"
          className="btn-ghost btn-sm"
          style={{ justifySelf: 'start' }}
          onClick={() => cambiar({ clasificables: [...p.clasificables, { texto: '', categoria: 0 }] })}
        >
          + Tarjeta
        </button>
      )}
    </div>
  );
}

// Una pregunta del editor: tipo de interacción, enunciado, puntos y solo los
// campos que ese tipo necesita.
export default function EditorPregunta({ pregunta: p, indice, onCambiar, onQuitar, puedeQuitar }) {
  const cambiar = (cambios) => onCambiar(cambios);
  const { min, max } = LIMITES[p.tipo];

  return (
    <div className="pregunta-editor">
      <div className="pregunta-editor-top">
        <span className="pregunta-num">{indice + 1}</span>
        <label className="form-field">
          Enunciado
          <input
            value={p.enunciado}
            onChange={(e) => cambiar({ enunciado: e.target.value })}
            maxLength={255}
            placeholder="Ej: ¿Cuánto es 7 − 2?"
          />
        </label>
        <label className="form-field campo-puntos">
          Puntos
          <input
            type="number"
            min={1}
            max={10}
            value={p.puntos}
            onChange={(e) => cambiar({ puntos: e.target.value === '' ? '' : Number(e.target.value) })}
          />
        </label>
        <button
          type="button"
          className="btn-ghost btn-sm"
          style={{ marginTop: '1.4rem' }}
          onClick={onQuitar}
          disabled={!puedeQuitar}
          aria-label={`Quitar pregunta ${indice + 1}`}
        >
          🗑
        </button>
      </div>

      <div className="tipo-selector" role="radiogroup" aria-label={`Tipo de la pregunta ${indice + 1}`}>
        {Object.entries(TIPOS).map(([tipo, t]) => (
          <button
            key={tipo}
            type="button"
            role="radio"
            aria-checked={p.tipo === tipo}
            className={`tipo-opcion ${p.tipo === tipo ? 'activo' : ''}`}
            onClick={() => cambiar({ tipo })}
          >
            <span className="tipo-icono" aria-hidden="true">
              {t.icono}
            </span>
            {t.nombre}
          </button>
        ))}
      </div>
      <p className="tipo-ayuda">{TIPOS[p.tipo].ayuda}</p>

      {p.tipo === 'MULTIPLE_CHOICE' && <CamposSeleccionMultiple p={p} cambiar={cambiar} />}
      {p.tipo === 'IMAGE_CHOICE' && <CamposSeleccionImagen p={p} cambiar={cambiar} />}
      {p.tipo === 'ORDERING' && (
        <>
          <p className="tipo-ayuda">Escríbelos en el orden correcto: los niños los verán mezclados.</p>
          <ListaTextos
            valores={p.elementos}
            onCambiar={(elementos) => cambiar({ elementos })}
            min={min}
            max={max}
            placeholder="Elemento"
            etiqueta="Elemento"
            numerada
          />
        </>
      )}
      {p.tipo === 'MATCHING' && <CamposRelacionar p={p} cambiar={cambiar} />}
      {p.tipo === 'CLASSIFICATION' && <CamposClasificar p={p} cambiar={cambiar} />}
    </div>
  );
}
