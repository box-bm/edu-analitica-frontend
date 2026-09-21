import { useEffect, useState } from 'react';
import Badge from '../../components/dashboard/Badge';
import Modal from '../../components/dashboard/Modal';
import seccionesService from '../../services/seccionesService';

const FORM_VACIO = { idGrado: '', nombreSeccion: '' };

export default function SeccionesAdmin() {
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filtroGrado, setFiltroGrado] = useState('Todos');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [seccionEditando, setSeccionEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [intentos, setIntentos] = useState(0);

  // The fetch function lives inside the effect (like AuthContext's
  // restoreSession) instead of the component body — calling a component-scope
  // function that sets state from an effect trips react-hooks/set-state-in-effect,
  // even when every setState happens after an await. `intentos` as a dependency
  // is what lets "Reintentar" re-run this without duplicating the fetch logic.
  useEffect(() => {
    let cancelado = false;

    async function cargarDatos() {
      const [resGrados, resSecciones] = await Promise.all([
        seccionesService.listarGrados(),
        seccionesService.listarSecciones(),
      ]);

      if (cancelado) return;

      if (!resGrados.success) {
        setLoadError(resGrados.error);
      } else if (!resSecciones.success) {
        setLoadError(resSecciones.error);
      } else {
        setLoadError(null);
        setGrados(resGrados.data);
        setSecciones(resSecciones.data);
      }

      setLoading(false);
    }

    cargarDatos();

    return () => {
      cancelado = true;
    };
  }, [intentos]);

  const reintentar = () => {
    setLoading(true);
    setLoadError(null);
    setIntentos((n) => n + 1);
  };

  const visibles =
    filtroGrado === 'Todos' ? secciones : secciones.filter((s) => String(s.idGrado) === filtroGrado);

  const abrirCrear = () => {
    setSeccionEditando(null);
    setForm({ idGrado: grados[0] ? String(grados[0].id) : '', nombreSeccion: '' });
    setFormError(null);
    setModalAbierto(true);
  };

  const abrirEditar = (seccion) => {
    setSeccionEditando(seccion);
    setForm({ idGrado: String(seccion.idGrado), nombreSeccion: seccion.nombreSeccion });
    setFormError(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);

    const nombreSeccion = form.nombreSeccion.trim();

    const resultado = seccionEditando
      ? await seccionesService.actualizar(seccionEditando.id, { nombreSeccion })
      : await seccionesService.crear({ idGrado: Number(form.idGrado), nombreSeccion });

    if (!resultado.success) {
      setFormError(resultado.error);
      setGuardando(false);
      return;
    }

    setSecciones((prev) => {
      if (seccionEditando) {
        return prev.map((s) => (s.id === resultado.data.id ? resultado.data : s));
      }
      return [...prev, resultado.data];
    });

    setGuardando(false);
    setModalAbierto(false);
  };

  const alternarActiva = async (seccion) => {
    const resultado = seccion.activa
      ? await seccionesService.eliminar(seccion.id)
      : await seccionesService.actualizar(seccion.id, { activa: true });

    if (resultado.success) {
      setSecciones((prev) => prev.map((s) => (s.id === resultado.data.id ? resultado.data : s)));
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <p>Cargando secciones…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="panel">
        <p className="form-error">{loadError}</p>
        <button className="btn-primary" onClick={reintentar}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="section-actions">
        <h3 className="panel-title" style={{ margin: 0 }}>
          Secciones por grado
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="form-field"
            style={{ minWidth: 160 }}
            value={filtroGrado}
            onChange={(e) => setFiltroGrado(e.target.value)}
          >
            <option value="Todos">Todos los grados</option>
            {grados.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.nombreGrado}
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={abrirCrear} disabled={grados.length === 0}>
            + Nueva sección
          </button>
        </div>
      </div>

      {grados.length === 0 && (
        <p className="form-feedback" style={{ color: '#94a3b8' }}>
          No hay grados registrados todavía — crea un grado antes de poder agregar secciones.
        </p>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Grado</th>
            <th>Sección</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((s) => (
            <tr key={s.id}>
              <td>{s.grado?.nombreGrado}</td>
              <td>{s.nombreSeccion}</td>
              <td>
                <Badge>{s.activa ? 'Activo' : 'Inactivo'}</Badge>
              </td>
              <td style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={() => abrirEditar(s)}>
                  Editar
                </button>
                <button className="btn-primary" onClick={() => alternarActiva(s)}>
                  {s.activa ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr>
              <td colSpan={4} style={{ color: '#94a3b8' }}>
                No hay secciones para este filtro.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal title={seccionEditando ? 'Editar sección' : 'Nueva sección'} onClose={cerrarModal}>
          <form className="dashboard-form" style={{ flexDirection: 'column', alignItems: 'stretch' }} onSubmit={guardar}>
            <label className="form-field">
              Grado
              <select
                value={form.idGrado}
                onChange={(e) => setForm({ ...form, idGrado: e.target.value })}
                disabled={!!seccionEditando}
                required
              >
                {grados.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.nombreGrado}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Nombre de la sección
              <input
                value={form.nombreSeccion}
                onChange={(e) => setForm({ ...form, nombreSeccion: e.target.value })}
                placeholder="Ej: A, B, 1A"
                maxLength={5}
                required
              />
            </label>

            {formError && <p className="form-error">{formError}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={cerrarModal} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
