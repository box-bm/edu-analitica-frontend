import { useState } from 'react';
import Badge from '../../components/dashboard/Badge';
import { USUARIOS } from '../../data/mockData';

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState(USUARIOS);
  const [filtro, setFiltro] = useState('Todos');

  const visibles = filtro === 'Todos' ? usuarios : usuarios.filter((u) => u.rol === filtro);

  const toggleEstado = (id) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, estado: u.estado === 'Activo' ? 'Inactivo' : 'Activo' } : u))
    );
  };

  return (
    <div className="panel">
      <div className="section-actions">
        <h3 className="panel-title" style={{ margin: 0 }}>
          Usuarios del sistema
        </h3>
        <select className="form-field" style={{ minWidth: 160 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          {['Todos', 'Admin', 'Docente', 'Estudiante'].map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.usuario}</td>
              <td>
                <Badge>{u.rol}</Badge>
              </td>
              <td>
                <Badge>{u.estado}</Badge>
              </td>
              <td>
                <button className="btn-primary" onClick={() => toggleEstado(u.id)}>
                  {u.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="form-feedback" style={{ color: '#94a3b8' }}>
        Datos de ejemplo — los cambios no se guardan en el servidor.
      </p>
    </div>
  );
}
