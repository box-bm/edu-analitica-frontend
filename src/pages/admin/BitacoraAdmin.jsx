import { useCallback, useState } from 'react';
import useCarga from '../../hooks/useCarga';
import auditoriaService, { ACCIONES_AUDITORIA, ACCIONES_INCIDENTE } from '../../services/auditoriaService';
import usuariosService from '../../services/usuariosService';

const LIMITE = 50;

const cargarUsuarios = () => usuariosService.listar();

const fechaHora = new Intl.DateTimeFormat('es-GT', {
  timeZone: 'America/Guatemala',
  dateStyle: 'medium',
  timeStyle: 'medium',
});

const etiquetaAccion = (accion) => ACCIONES_AUDITORIA[accion] ?? accion;

export default function BitacoraAdmin() {
  const [filtros, setFiltros] = useState({ accion: '', desde: '', hasta: '' });
  const [pagina, setPagina] = useState(1);

  const cargar = useCallback(
    () => auditoriaService.listar({ ...filtros, limite: LIMITE, pagina }),
    [filtros, pagina]
  );
  const { datos, error, cargando, recargar } = useCarga(cargar);
  // Solo para mostrar nombres: si falla, la tabla cae al id.
  const { datos: usuarios } = useCarga(cargarUsuarios);

  const nombres = new Map((usuarios ?? []).map((u) => [u.id, u.nombreCompleto]));

  const filtrar = (campo, valor) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPagina(1);
  };

  const paginas = datos ? Math.max(1, Math.ceil(datos.total / datos.limite)) : 1;

  return (
    <div className="panel">
      <div className="section-actions">
        <div className="filtros">
          <select
            className="form-field"
            value={filtros.accion}
            onChange={(e) => filtrar('accion', e.target.value)}
            aria-label="Filtrar por acción"
          >
            <option value="">Todas las acciones</option>
            {Object.entries(ACCIONES_AUDITORIA).map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </select>
          <label className="form-field filtro-fecha">
            Desde
            <input type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={(e) => filtrar('desde', e.target.value)} />
          </label>
          <label className="form-field filtro-fecha">
            Hasta
            <input type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={(e) => filtrar('hasta', e.target.value)} />
          </label>
        </div>
        <button className="btn-secondary" onClick={recargar} disabled={cargando}>Actualizar</button>
      </div>

      {error && (
        <div className="estado-vacio">
          <span className="estado-emoji">📡</span>
          <p>{error}</p>
          <button className="btn-secondary" onClick={recargar}>Reintentar</button>
        </div>
      )}

      {!error && !datos && <p className="cargando">Cargando bitácora…</p>}

      {!error && datos && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Usuario</th>
                <th>Grupo</th>
                <th>IP</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {datos.registros.map((r) => {
                const incidente = ACCIONES_INCIDENTE.has(r.accion);
                return (
                  <tr key={r.id} className={incidente ? 'fila-incidente' : undefined}>
                    <td className="texto-suave">{fechaHora.format(new Date(r.fecha))}</td>
                    <td>
                      {incidente && <span aria-label="Posible incidente">⚠️ </span>}
                      <strong>{etiquetaAccion(r.accion)}</strong>
                    </td>
                    <td>{r.idUsuario == null ? '—' : nombres.get(r.idUsuario) ?? `#${r.idUsuario}`}</td>
                    <td>{r.idGrupo == null ? '—' : `#${r.idGrupo}`}</td>
                    <td className="texto-suave">{r.ip ?? '—'}</td>
                    <td>
                      {r.detalle ? (
                        <details>
                          <summary>Ver</summary>
                          <pre className="detalle-auditoria">{JSON.stringify(r.detalle, null, 2)}</pre>
                        </details>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
              {datos.registros.length === 0 && (
                <tr>
                  <td colSpan={6} className="texto-suave">No hay registros con estos filtros.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="paginacion">
            <span className="texto-suave">
              {datos.total} registro{datos.total === 1 ? '' : 's'} · página {datos.pagina} de {paginas}
            </span>
            <span style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn-secondary btn-sm" onClick={() => setPagina((p) => p - 1)} disabled={pagina <= 1 || cargando}>
                ← Anterior
              </button>
              <button className="btn-secondary btn-sm" onClick={() => setPagina((p) => p + 1)} disabled={pagina >= paginas || cargando}>
                Siguiente →
              </button>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
