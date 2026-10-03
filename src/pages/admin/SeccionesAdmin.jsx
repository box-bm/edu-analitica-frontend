import { useEffect, useState } from 'react';
import Badge from '../../components/dashboard/Badge';
import Modal from '../../components/dashboard/Modal';
import seccionesService, { ciclosDe, porOrden } from '../../services/seccionesService';
import GradosPanel from './GradosPanel';

const CICLO_ACTUAL = new Date().getFullYear();
const FORM_VACIO = { idGrado: '', nombreSeccion: '', ciclo: String(CICLO_ACTUAL) };

export default function SeccionesAdmin() {
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filtroGrado, setFiltroGrado] = useState('Todos');
  // Por defecto, el ciclo en curso: así las secciones de años anteriores no se
  // mezclan con las de este año.
  const [filtroCiclo, setFiltroCiclo] = useState(String(CICLO_ACTUAL));

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
        setGrados([...resGrados.data].sort(porOrden));
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

  const gradosActivos = grados.filter((g) => g.activo);
  // El ciclo en curso aparece aunque todavía no tenga secciones.
  const ciclos = ciclosDe([...secciones, { ciclo: CICLO_ACTUAL }]);

  const visibles = secciones.filter(
    (s) =>
      (filtroGrado === 'Todos' || String(s.idGrado) === filtroGrado) &&
      (filtroCiclo === 'Todos' || String(s.ciclo) === filtroCiclo)
  );

  const gradoGuardado = (grado) => {
    setGrados((prev) => {
      const existe = prev.some((g) => g.id === grado.id);
      const lista = existe ? prev.map((g) => (g.id === grado.id ? grado : g)) : [...prev, grado];
      return lista.sort(porOrden);
    });
    // El nombre del grado se muestra en cada sección.
    setSecciones((prev) =>
      prev.map((s) => (s.idGrado === grado.id ? { ...s, grado: { ...s.grado, ...grado } } : s))
    );
  };

  const abrirCrear = () => {
    setSeccionEditando(null);
    setForm({
      idGrado: gradosActivos[0] ? String(gradosActivos[0].id) : '',
      nombreSeccion: '',
      ciclo: filtroCiclo === 'Todos' ? String(CICLO_ACTUAL) : filtroCiclo,
    });
    setFormError(null);
    setModalAbierto(true);
  };

  const abrirEditar = (seccion) => {
    setSeccionEditando(seccion);
    setForm({ idGrado: String(seccion.idGrado), nombreSeccion: seccion.nombreSeccion, ciclo: String(seccion.ciclo) });
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
      : await seccionesService.crear({ idGrado: Number(form.idGrado), nombreSeccion, ciclo: Number(form.ciclo) });

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
    <div>
      <GradosPanel grados={grados} onGuardado={gradoGuardado} />

      <div className="panel">
        <div className="section-actions">
          <h3 className="panel-title" style={{ margin: 0 }}>
            Secciones por ciclo y grado
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="form-field"
              style={{ minWidth: 140 }}
              value={filtroCiclo}
              onChange={(e) => setFiltroCiclo(e.target.value)}
              aria-label="Filtrar por ciclo escolar"
            >
              <option value="Todos">Todos los ciclos</option>
              {ciclos.map((c) => (
                <option key={c} value={String(c)}>
                  Ciclo {c}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por grado"
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
            <button className="btn-primary" onClick={abrirCrear} disabled={gradosActivos.length === 0}>
              + Nueva sección
            </button>
          </div>
        </div>

        {gradosActivos.length === 0 && (
          <p className="form-feedback" style={{ color: '#8390a8' }}>
            No hay grados activos — crea o activa un grado antes de poder agregar secciones.
          </p>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Ciclo</th>
              <th>Grado</th>
              <th>Sección</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((s) => (
              <tr key={s.id}>
                <td>{s.ciclo}</td>
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
                <td colSpan={5} style={{ color: '#8390a8' }}>
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
                  {/* Al editar, el grado de la sección puede estar inactivo. */}
                  {(seccionEditando ? grados : gradosActivos).map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.nombreGrado}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                Ciclo escolar
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={form.ciclo}
                  onChange={(e) => setForm({ ...form, ciclo: e.target.value })}
                  disabled={!!seccionEditando}
                  required
                />
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
    </div>
  );
}
