import { useState } from 'react';
import Badge from '../../components/dashboard/Badge';
import Modal from '../../components/dashboard/Modal';
import { useAuth } from '../../context/AuthContext';
import useCarga from '../../hooks/useCarga';
import usuariosService from '../../services/usuariosService';
import { nombreRol } from '../../utils/rol';

const ETIQUETA_ROL = { administrador: 'Admin', docente: 'Docente' };
const FORM_VACIO = { nombreCompleto: '', usuario: '', password: '', rol: 'docente' };

const cargarUsuarios = () => usuariosService.listar();

const fecha = new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'short', year: 'numeric' });

export default function UsuariosAdmin() {
  const { user } = useAuth();
  const { datos: usuarios, error, cargando, recargar } = useCarga(cargarUsuarios);

  const [filtroRol, setFiltroRol] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null); // null | 'nuevo' | usuario
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [aviso, setAviso] = useState(null);

  if (cargando && !usuarios) return <p className="cargando">Cargando usuarios…</p>;
  if (error) {
    return (
      <div className="panel estado-vacio">
        <span className="estado-emoji">📡</span>
        <p>{error}</p>
        <button className="btn-secondary" onClick={recargar}>Reintentar</button>
      </div>
    );
  }

  const texto = busqueda.trim().toLowerCase();
  const visibles = usuarios.filter(
    (u) =>
      (!filtroRol || nombreRol(u.rol) === filtroRol) &&
      (!texto || u.nombreCompleto.toLowerCase().includes(texto) || u.usuario.toLowerCase().includes(texto))
  );

  const abrirNuevo = () => {
    setForm(FORM_VACIO);
    setFormError(null);
    setEditando('nuevo');
  };

  const abrirEditar = (u) => {
    setForm({ nombreCompleto: u.nombreCompleto, usuario: u.usuario, password: '', rol: nombreRol(u.rol) });
    setFormError(null);
    setEditando(u);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);

    const datos = { ...form, nombreCompleto: form.nombreCompleto.trim(), usuario: form.usuario.trim() };
    let result;
    if (editando === 'nuevo') {
      result = await usuariosService.crear(datos);
    } else {
      // La contraseña solo se envía si se escribió una nueva.
      const { password, ...resto } = datos;
      result = await usuariosService.actualizar(editando.id, password ? datos : resto);
    }
    setGuardando(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setAviso(editando === 'nuevo' ? `Usuario "${result.data.usuario}" creado.` : 'Cambios guardados.');
    setEditando(null);
    recargar();
  };

  const alternarActivo = async (u) => {
    const result = await usuariosService.actualizar(u.id, { activo: !u.activo });
    setAviso(
      result.success
        ? `${u.nombreCompleto} ${u.activo ? 'ya no puede iniciar sesión' : 'puede volver a iniciar sesión'}.`
        : result.error
    );
    if (result.success) recargar();
  };

  const esYo = (u) => u.id === user?.id;

  return (
    <div>
      {aviso && (
        <div className="insight-box aviso-cerrable" role="status" style={{ marginBottom: '1.5rem' }}>
          <span>✨ {aviso}</span>
          <button className="btn-ghost btn-sm" onClick={() => setAviso(null)} aria-label="Cerrar aviso">✕</button>
        </div>
      )}

      <div className="panel">
        <div className="section-actions">
          <div className="filtros">
            <input
              className="form-field buscador"
              type="search"
              placeholder="Buscar por nombre o usuario"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar usuario"
            />
            <select className="form-field" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} aria-label="Filtrar por rol">
              <option value="">Todos los roles</option>
              <option value="docente">Docentes</option>
              <option value="administrador">Administradores</option>
            </select>
          </div>
          <button className="btn-primary" onClick={abrirNuevo}>+ Nuevo usuario</button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Creado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.nombreCompleto}</strong>
                  {esYo(u) && <span className="texto-suave"> (tú)</span>}
                </td>
                <td>{u.usuario}</td>
                <td><Badge>{ETIQUETA_ROL[nombreRol(u.rol)] ?? nombreRol(u.rol)}</Badge></td>
                <td><Badge>{u.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                <td className="texto-suave">{fecha.format(new Date(u.creadoEn))}</td>
                <td>
                  <span style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary btn-sm" onClick={() => abrirEditar(u)}>Editar</button>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => alternarActivo(u)}
                      disabled={esYo(u)}
                      title={esYo(u) ? 'No puedes desactivar tu propia cuenta' : undefined}
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={6} className="texto-suave">No hay usuarios con este filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editando && (
        <Modal title={editando === 'nuevo' ? 'Nuevo usuario' : 'Editar usuario'} onClose={() => setEditando(null)}>
          <form className="dashboard-form" style={{ flexDirection: 'column', alignItems: 'stretch' }} onSubmit={guardar}>
            <label className="form-field">
              Nombre completo
              <input value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} maxLength={100} required autoFocus />
            </label>
            <label className="form-field">
              Usuario
              <input value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} minLength={3} maxLength={50} autoComplete="off" required />
            </label>
            <label className="form-field">
              {editando === 'nuevo' ? 'Contraseña' : 'Nueva contraseña (opcional)'}
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                autoComplete="new-password"
                placeholder={editando === 'nuevo' ? 'Mínimo 8 caracteres' : 'Déjala vacía para no cambiarla'}
                required={editando === 'nuevo'}
              />
            </label>
            <label className="form-field">
              Rol
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
                disabled={editando !== 'nuevo' && esYo(editando)}
              >
                <option value="docente">Docente</option>
                <option value="administrador">Administrador</option>
              </select>
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditando(null)} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
