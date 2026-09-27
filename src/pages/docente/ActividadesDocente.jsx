import { useEffect, useState } from 'react';
import Badge from '../../components/dashboard/Badge';
import Modal from '../../components/dashboard/Modal';
import actividadesService, { MAX_PREGUNTAS } from '../../services/actividadesService';
import './docente.css';

const MAX_OPCIONES = 4;
const preguntaVacia = () => ({ enunciado: '', opciones: ['', ''], correcta: null });

const etiquetaModulo = (m) => `${m.grado?.nombreGrado ?? ''} — ${m.icono ?? ''} ${m.nombreModulo}`;

// El formulario guarda la correcta como índice; la API espera el texto.
function aApi(preguntas) {
  return preguntas.map((p) => {
    const opciones = p.opciones.map((o) => o.trim());
    return {
      enunciado: p.enunciado.trim(),
      opciones,
      respuestaCorrecta: p.correcta === null ? '' : opciones[p.correcta],
    };
  });
}

function desdeApi(preguntas) {
  return preguntas.map((p) => ({
    enunciado: p.enunciado,
    opciones: [...p.opciones],
    correcta: p.opciones.indexOf(p.respuestaCorrecta),
  }));
}

function validar(form) {
  if (!form.idModulo) return 'Elige un módulo.';
  if (!form.titulo.trim()) return 'Escribe un título.';
  for (const [i, p] of form.preguntas.entries()) {
    const n = i + 1;
    if (!p.enunciado.trim()) return `La pregunta ${n} no tiene enunciado.`;
    const opciones = p.opciones.map((o) => o.trim());
    if (opciones.some((o) => !o)) return `La pregunta ${n} tiene opciones vacías.`;
    if (new Set(opciones).size !== opciones.length) return `La pregunta ${n} tiene opciones repetidas.`;
    if (p.correcta === null || p.correcta < 0) return `Marca la respuesta correcta de la pregunta ${n}.`;
  }
  return null;
}

export default function ActividadesDocente() {
  const [modulos, setModulos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [intentos, setIntentos] = useState(0);

  const [filtroGrado, setFiltroGrado] = useState('Todos');
  const [soloMias, setSoloMias] = useState(false);

  // editor: null | { modo: 'crear'|'editar'|'ver', id?, form, original? }
  const [editor, setEditor] = useState(null);
  const [abriendo, setAbriendo] = useState(false);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      const [resModulos, resActividades] = await Promise.all([
        actividadesService.listarModulos(),
        actividadesService.listarMisActividades(),
      ]);
      if (cancelado) return;

      const fallo = [resModulos, resActividades].find((r) => !r.success);
      if (fallo) {
        setLoadError(fallo.error);
      } else {
        setLoadError(null);
        setModulos(resModulos.data);
        setActividades(resActividades.data);
      }
      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [intentos]);

  const recargar = () => setIntentos((n) => n + 1);

  const grados = [...new Map(modulos.map((m) => [m.grado?.id, m.grado])).values()].filter(Boolean);

  const visibles = actividades.filter(
    (a) =>
      (filtroGrado === 'Todos' || String(a.modulo.grado?.id) === filtroGrado) && (!soloMias || a.esPropia)
  );

  const abrirCrear = () => {
    setEditor({
      modo: 'crear',
      form: {
        idModulo: modulos[0] ? String(modulos[0].id) : '',
        titulo: '',
        descripcion: '',
        preguntas: [preguntaVacia()],
      },
    });
  };

  const abrirExistente = async (actividad) => {
    setAbriendo(true);
    const result = await actividadesService.obtener(actividad.id);
    setAbriendo(false);
    if (!result.success) {
      setAviso(result.error);
      return;
    }
    const a = result.data;
    const form = {
      idModulo: String(a.modulo.id),
      titulo: a.titulo,
      descripcion: a.descripcion ?? '',
      preguntas: desdeApi(a.preguntas),
    };
    setEditor({
      modo: a.esPropia ? 'editar' : 'ver',
      id: a.id,
      form,
      original: JSON.stringify(aApi(form.preguntas)),
      detalle: a,
    });
  };

  const desactivar = async (actividad) => {
    const result = await actividadesService.eliminar(actividad.id);
    setAviso(result.success ? `"${actividad.titulo}" ya no aparece para los grupos.` : result.error);
    if (result.success) recargar();
  };

  if (cargando) {
    return <p className="cargando">Cargando actividades…</p>;
  }

  if (loadError) {
    return (
      <div className="panel estado-vacio">
        <span className="estado-emoji">📡</span>
        <p>{loadError}</p>
        <button className="btn-secondary" onClick={() => { setCargando(true); recargar(); }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {aviso && (
        <div className="insight-box aviso-cerrable" role="status" style={{ marginBottom: '1.5rem' }}>
          <span>✨ {aviso}</span>
          <button className="btn-ghost btn-sm" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            ✕
          </button>
        </div>
      )}

      <div className="panel">
        <div className="section-actions">
          <div className="filtros">
            <select className="form-field" value={filtroGrado} onChange={(e) => setFiltroGrado(e.target.value)}>
              <option value="Todos">Todos los grados</option>
              {grados.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.nombreGrado}
                </option>
              ))}
            </select>
            <button className="chip-toggle" aria-pressed={soloMias} onClick={() => setSoloMias((v) => !v)}>
              {soloMias ? '✓ ' : ''}Solo mis actividades
            </button>
          </div>
          <button className="btn-primary" onClick={abrirCrear} disabled={modulos.length === 0}>
            + Nueva actividad
          </button>
        </div>

        {modulos.length === 0 && (
          <p className="form-error">
            No hay módulos todavía. Backend: ejecutar <code>npm run seed:actividades</code>.
          </p>
        )}

        {visibles.length === 0 ? (
          <div className="estado-vacio">
            <span className="estado-emoji">🧩</span>
            <h3>No hay actividades con este filtro</h3>
            <p>Crea una actividad propia: sus preguntas solo las verán tus grupos.</p>
          </div>
        ) : (
          <div className="actividades-docente">
            {visibles.map((a) => (
              <article key={a.id} className="actividad-card">
                <div className="actividad-card-top">
                  <span className="actividad-modulo">
                    {a.modulo.icono} {a.modulo.nombreModulo} · {a.modulo.grado?.nombreGrado}
                  </span>
                  <Badge>{a.esCatalogo ? 'Catálogo' : 'Propia'}</Badge>
                </div>
                <h4>{a.titulo}</h4>
                {a.descripcion && <p>{a.descripcion}</p>}
                <footer>
                  <span className="texto-suave">{a.totalPreguntas} preguntas</span>
                  <button className="btn-secondary btn-sm" onClick={() => abrirExistente(a)} disabled={abriendo}>
                    {a.esPropia ? 'Editar' : 'Ver'}
                  </button>
                  {a.esPropia && (
                    <button className="btn-ghost btn-sm" onClick={() => desactivar(a)}>
                      Quitar
                    </button>
                  )}
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>

      {editor && (
        <EditorActividad
          editor={editor}
          setEditor={setEditor}
          modulos={modulos}
          onGuardado={(mensaje) => {
            setEditor(null);
            setAviso(mensaje);
            recargar();
          }}
        />
      )}
    </div>
  );
}

// Se monta solo con un editor abierto, así `editor` nunca es null aquí. (En
// la página, el React Compiler memoiza closures por `editor.form` y los
// evaluaba con el editor cerrado.)
function EditorActividad({ editor, setEditor, modulos, onGuardado }) {
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const soloLectura = editor.modo === 'ver';
  const nPreguntas = editor.form.preguntas.length;

  const actualizarForm = (cambios) => setEditor((e) => ({ ...e, form: { ...e.form, ...cambios } }));

  const cambiarPreguntas = (fn) =>
    setEditor((e) => ({ ...e, form: { ...e.form, preguntas: fn(e.form.preguntas) } }));

  const actualizarPregunta = (indice, cambios) =>
    cambiarPreguntas((preguntas) => preguntas.map((p, i) => (i === indice ? { ...p, ...cambios } : p)));

  const quitarOpcion = (iPregunta, iOpcion) =>
    cambiarPreguntas((preguntas) =>
      preguntas.map((p, i) => {
        if (i !== iPregunta) return p;
        let correcta = p.correcta;
        if (correcta === iOpcion) correcta = null;
        else if (correcta !== null && correcta > iOpcion) correcta -= 1;
        return { ...p, opciones: p.opciones.filter((_, j) => j !== iOpcion), correcta };
      })
    );

  const guardar = async (e) => {
    e.preventDefault();
    const problema = validar(editor.form);
    if (problema) {
      setFormError(problema);
      return;
    }

    setGuardando(true);
    setFormError(null);
    const preguntas = aApi(editor.form.preguntas);
    const base = {
      titulo: editor.form.titulo.trim(),
      descripcion: editor.form.descripcion.trim() || null,
    };

    const result =
      editor.modo === 'crear'
        ? await actividadesService.crear({ ...base, idModulo: Number(editor.form.idModulo), preguntas })
        : // Solo se envían las preguntas si cambiaron: una actividad ya
          // resuelta admite cambiar el título pero no sus preguntas (409).
          await actividadesService.actualizar(editor.id, {
            ...base,
            ...(JSON.stringify(preguntas) !== editor.original ? { preguntas } : {}),
          });
    setGuardando(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }
    onGuardado(editor.modo === 'crear' ? `Actividad "${result.data.titulo}" creada.` : 'Cambios guardados.');
  };

  return (
    <Modal
      wide
      title={
        editor.modo === 'crear' ? 'Nueva actividad' : soloLectura ? editor.form.titulo : 'Editar actividad'
      }
      onClose={() => setEditor(null)}
    >
      {soloLectura ? (
        <>
          <p className="texto-suave" style={{ marginTop: 0 }}>
            Actividad del catálogo base ({etiquetaModulo(editor.detalle.modulo)}). No se puede editar,
            pero puedes crear una propia a partir de ella.
          </p>
          <ol className="lectura-pregunta">
            {editor.detalle.preguntas.map((p) => (
              <li key={p.id}>
                <strong>{p.enunciado}</strong>
                <ul>
                  {p.opciones.map((o) => (
                    <li key={o} className={o === p.respuestaCorrecta ? 'correcta' : ''}>
                      {o === p.respuestaCorrecta ? '✓ ' : ''}
                      {o}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setEditor(null)}>
              Cerrar
            </button>
            <button
              className="btn-primary"
              onClick={() =>
                setEditor({
                  modo: 'crear',
                  form: { ...editor.form, titulo: `${editor.form.titulo} (copia)` },
                })
              }
            >
              Crear una copia editable
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={guardar}>
          <div className="editor-grid">
            <label className="form-field">
              Módulo
              <select
                value={editor.form.idModulo}
                onChange={(e) => actualizarForm({ idModulo: e.target.value })}
                disabled={editor.modo === 'editar'}
                required
              >
                {modulos.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {etiquetaModulo(m)}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Título
              <input
                value={editor.form.titulo}
                onChange={(e) => actualizarForm({ titulo: e.target.value })}
                maxLength={100}
                placeholder="Ej: Restas con dulces"
                required
              />
            </label>
            <label className="form-field">
              Descripción corta (opcional)
              <input
                value={editor.form.descripcion}
                onChange={(e) => actualizarForm({ descripcion: e.target.value })}
                maxLength={255}
                placeholder="Lo que verán los niños debajo del título"
              />
            </label>
          </div>

          <div className="editor-preguntas-cabecera">
            <h4>Preguntas</h4>
            <span className={`contador-preguntas ${nPreguntas >= MAX_PREGUNTAS ? 'lleno' : ''}`}>
              {nPreguntas}/{MAX_PREGUNTAS}
            </span>
          </div>

          {editor.form.preguntas.map((p, iP) => (
            <div key={iP} className="pregunta-editor">
              <div className="pregunta-editor-top">
                <span className="pregunta-num">{iP + 1}</span>
                <label className="form-field">
                  Enunciado
                  <input
                    value={p.enunciado}
                    onChange={(e) => actualizarPregunta(iP, { enunciado: e.target.value })}
                    maxLength={255}
                    placeholder="Ej: ¿Cuánto es 7 − 2?"
                  />
                </label>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  style={{ marginTop: '1.4rem' }}
                  onClick={() => cambiarPreguntas((ps) => ps.filter((_, i) => i !== iP))}
                  disabled={nPreguntas === 1}
                  aria-label={`Quitar pregunta ${iP + 1}`}
                >
                  🗑
                </button>
              </div>

              <div className="opciones-editor">
                {p.opciones.map((o, iO) => (
                  <div key={iO} className={`opcion-editor ${p.correcta === iO ? 'es-correcta' : ''}`}>
                    <input
                      type="text"
                      value={o}
                      onChange={(e) =>
                        actualizarPregunta(iP, {
                          opciones: p.opciones.map((x, i) => (i === iO ? e.target.value : x)),
                        })
                      }
                      maxLength={100}
                      placeholder={`Opción ${iO + 1}`}
                      aria-label={`Pregunta ${iP + 1}, opción ${iO + 1}`}
                    />
                    <label className="opcion-correcta">
                      <input
                        type="radio"
                        name={`correcta-${iP}`}
                        checked={p.correcta === iO}
                        onChange={() => actualizarPregunta(iP, { correcta: iO })}
                      />
                      Correcta
                    </label>
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => quitarOpcion(iP, iO)}
                      disabled={p.opciones.length <= 2}
                      aria-label={`Quitar opción ${iO + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {p.opciones.length < MAX_OPCIONES && (
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    style={{ justifySelf: 'start' }}
                    onClick={() => actualizarPregunta(iP, { opciones: [...p.opciones, ''] })}
                  >
                    + Opción
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: '0.9rem' }}
            onClick={() => cambiarPreguntas((ps) => [...ps, preguntaVacia()])}
            disabled={nPreguntas >= MAX_PREGUNTAS}
          >
            + Agregar pregunta
          </button>

          {formError && <p className="form-error">{formError}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setEditor(null)} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar actividad'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
