import { useState } from 'react';
import Badge from '../../components/dashboard/Badge';
import Modal from '../../components/dashboard/Modal';
import seccionesService from '../../services/seccionesService';

const FORM_VACIO = { nombreGrado: '', orden: '' };

/**
 * Catálogo de grados (1ro, 2do, 3ro…). Vive dentro de SeccionesAdmin porque
 * esa página también necesita la lista para sus filtros y su select.
 * @param {{ grados: object[], onGuardado: (grado: object) => void }} props
 */
export default function GradosPanel({ grados, onGuardado }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [gradoEditando, setGradoEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const abrirCrear = () => {
    const siguiente = grados.reduce((max, g) => Math.max(max, g.orden ?? 0), 0) + 1;
    setGradoEditando(null);
    setForm({ nombreGrado: '', orden: String(siguiente) });
    setFormError(null);
    setModalAbierto(true);
  };

  const abrirEditar = (grado) => {
    setGradoEditando(grado);
    setForm({ nombreGrado: grado.nombreGrado, orden: String(grado.orden ?? 0) });
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

    const datos = { nombreGrado: form.nombreGrado.trim(), orden: Number(form.orden) || 0 };
    const resultado = gradoEditando
      ? await seccionesService.actualizarGrado(gradoEditando.id, datos)
      : await seccionesService.crearGrado(datos);

    setGuardando(false);
    if (!resultado.success) {
      setFormError(resultado.error);
      return;
    }
    onGuardado(resultado.data);
    setModalAbierto(false);
  };

  const alternarActivo = async (grado) => {
    const resultado = await seccionesService.actualizarGrado(grado.id, { activo: !grado.activo });
    setAviso(resultado.success ? null : resultado.error);
    if (resultado.success) onGuardado(resultado.data);
  };

  return (
    <div className="panel">
      <div className="section-actions">
        <div>
          <h3 className="panel-title" style={{ margin: 0 }}>
            Grados
          </h3>
          <p className="texto-suave">
            Un grado inactivo no admite secciones nuevas; sus secciones y grupos actuales siguen igual.
          </p>
        </div>
        <button className="btn-primary" onClick={abrirCrear}>
          + Nuevo grado
        </button>
      </div>
      {aviso && <p className="form-error">{aviso}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Orden</th>
            <th>Grado</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {grados.map((g) => (
            <tr key={g.id}>
              <td>{g.orden ?? 0}</td>
              <td>{g.nombreGrado}</td>
              <td>
                <Badge>{g.activo ? 'Activo' : 'Inactivo'}</Badge>
              </td>
              <td style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={() => abrirEditar(g)}>
                  Editar
                </button>
                <button className="btn-primary" onClick={() => alternarActivo(g)}>
                  {g.activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
          {grados.length === 0 && (
            <tr>
              <td colSpan={4} style={{ color: '#8390a8' }}>
                No hay grados registrados todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal title={gradoEditando ? 'Editar grado' : 'Nuevo grado'} onClose={cerrarModal}>
          <form className="dashboard-form" style={{ flexDirection: 'column', alignItems: 'stretch' }} onSubmit={guardar}>
            <label className="form-field">
              Nombre del grado
              <input
                value={form.nombreGrado}
                onChange={(e) => setForm({ ...form, nombreGrado: e.target.value })}
                placeholder="Ej: 2do Primaria"
                maxLength={30}
                required
              />
            </label>
            <label className="form-field">
              Orden en las listas
              <input
                type="number"
                min={0}
                max={99}
                value={form.orden}
                onChange={(e) => setForm({ ...form, orden: e.target.value })}
              />
            </label>
            {!gradoEditando && (
              <p className="texto-suave">
                Si el nombre empieza con 1, 2 o 3 (por ejemplo “2do Primaria”), se le agregan los módulos y actividades
                base de ese grado.
              </p>
            )}

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
