import { useEffect, useState } from 'react';
import Modal from '../../components/dashboard/Modal';
import StatCard from '../../components/dashboard/StatCard';
import gruposService from '../../services/gruposService';
import './docente.css';

const FORM_VACIO = { idSeccion: '', nombreGrupo: '' };

const etiquetaSeccion = (s) => `${s.grado?.nombreGrado ?? ''} · Sección ${s.nombreSeccion}`;

const fecha = new Intl.DateTimeFormat('es-GT', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export default function Grupos() {
  const [grupos, setGrupos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [intentos, setIntentos] = useState(0);

  const [crearAbierto, setCrearAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [confirmacion, setConfirmacion] = useState(null); // { tipo: 'regenerar'|'desactivar', grupo }
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      const [resGrupos, resSecciones, resResultados] = await Promise.all([
        gruposService.listarMisGrupos(),
        gruposService.listarSecciones(),
        gruposService.resultados(),
      ]);
      if (cancelado) return;

      const fallo = [resGrupos, resSecciones, resResultados].find((r) => !r.success);
      if (fallo) {
        setLoadError(fallo.error);
      } else {
        setLoadError(null);
        setGrupos(resGrupos.data);
        setSecciones(resSecciones.data.filter((s) => s.activa));
        setResultados(resResultados.data);
      }
      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [intentos]);

  const recargar = () => setIntentos((n) => n + 1);

  const abrirCrear = () => {
    setForm({ idSeccion: secciones[0] ? String(secciones[0].id) : '', nombreGrupo: '' });
    setFormError(null);
    setCrearAbierto(true);
  };

  const crear = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);
    const result = await gruposService.crear({
      idSeccion: Number(form.idSeccion),
      nombreGrupo: form.nombreGrupo.trim(),
    });
    setGuardando(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setCrearAbierto(false);
    setAviso(`Grupo "${result.data.nombreGrupo}" creado. Su código es ${result.data.codigoAcceso}.`);
    recargar();
  };

  const confirmar = async () => {
    const { tipo, grupo } = confirmacion;
    setGuardando(true);
    setFormError(null);
    const result =
      tipo === 'regenerar'
        ? await gruposService.regenerarCodigo(grupo.id)
        : await gruposService.eliminar(grupo.id);
    setGuardando(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setConfirmacion(null);
    setAviso(
      tipo === 'regenerar'
        ? `Nuevo código para "${grupo.nombreGrupo}": ${result.data.codigoAcceso}. El anterior ya no funciona.`
        : `El grupo "${grupo.nombreGrupo}" fue desactivado.`
    );
    recargar();
  };

  if (cargando) {
    return <p className="cargando">Cargando grupos…</p>;
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

  const aciertos = resultados.reduce((n, r) => n + r.puntaje, 0);
  const posibles = resultados.reduce((n, r) => n + r.puntajeTotal, 0);

  return (
    <div>
      <div className="kpi-grid">
        <StatCard label="Grupos activos" value={grupos.length} accent="var(--orange)" />
        <StatCard label="Actividades resueltas" value={resultados.length} accent="var(--teal)" hint="Últimos intentos" />
        <StatCard
          label="Aciertos promedio"
          value={posibles ? `${Math.round((aciertos / posibles) * 100)}%` : '—'}
          accent="var(--sun)"
        />
      </div>

      {aviso && (
        <div className="insight-box aviso-cerrable" role="status">
          <span>✨ {aviso}</span>
          <button className="btn-ghost btn-sm" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            ✕
          </button>
        </div>
      )}

      <div className="panel" style={{ marginTop: aviso ? '1.5rem' : 0 }}>
        <div className="section-actions">
          <div>
            <h3 className="panel-title" style={{ margin: 0 }}>Mis grupos</h3>
            <p className="texto-suave">
              Cada grupo entra con su código en <strong>“¿Eres estudiante?”</strong> de la pantalla de inicio.
            </p>
          </div>
          <button className="btn-primary" onClick={abrirCrear} disabled={secciones.length === 0}>
            + Nuevo grupo
          </button>
        </div>

        {secciones.length === 0 && (
          <p className="form-error">No hay secciones activas. Pide a administración que cree una.</p>
        )}

        {grupos.length === 0 ? (
          <div className="estado-vacio">
            <span className="estado-emoji">🎒</span>
            <h3>Aún no tienes grupos</h3>
            <p>Crea un grupo por equipo de trabajo; recibirá un código de 6 letras para entrar.</p>
          </div>
        ) : (
          <div className="grupos-grid">
            {grupos.map((g) => (
              <article key={g.id} className="grupo-card">
                <header>
                  <div>
                    <h4>{g.nombreGrupo}</h4>
                    <span className="texto-suave">{etiquetaSeccion(g.seccion)}</span>
                  </div>
                </header>

                <div className="codigo-grande" aria-label={`Código de acceso ${g.codigoAcceso.split('').join(' ')}`}>
                  {g.codigoAcceso.split('').map((c, i) => (
                    <span key={i}>{c}</span>
                  ))}
                </div>

                {g.avances.length > 0 ? (
                  <ul className="avances">
                    {g.avances.map((a) => (
                      <li key={a.idModulo}>
                        <span>{a.nombreModulo}</span>
                        <span className="progreso" aria-label={`${a.porcentajeCompletado}%`}>
                          <span style={{ width: `${a.porcentajeCompletado}%` }} />
                        </span>
                        <b>{a.porcentajeCompletado}%</b>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="texto-suave">Todavía no ha resuelto actividades.</p>
                )}

                <footer>
                  <button className="btn-secondary btn-sm" onClick={() => { setFormError(null); setConfirmacion({ tipo: 'regenerar', grupo: g }); }}>
                    🔄 Nuevo código
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => { setFormError(null); setConfirmacion({ tipo: 'desactivar', grupo: g }); }}>
                    Desactivar
                  </button>
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h3 className="panel-title">Resultados recientes</h3>
        {resultados.length === 0 ? (
          <p className="texto-suave">Cuando un grupo termine una actividad, aparecerá aquí.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Actividad</th>
                <th>Módulo</th>
                <th>Aciertos</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {resultados.slice(0, 25).map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.grupo.nombreGrupo}</strong></td>
                  <td>{r.actividad.titulo}</td>
                  <td>{r.actividad.modulo}</td>
                  <td>
                    <span className="aciertos">
                      <span className="progreso" style={{ width: 70 }}>
                        <span style={{ width: `${(r.puntaje / r.puntajeTotal) * 100}%` }} />
                      </span>
                      {r.puntaje}/{r.puntajeTotal}
                    </span>
                  </td>
                  <td className="texto-suave">{fecha.format(new Date(r.completadoEn))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {crearAbierto && (
        <Modal title="Nuevo grupo" onClose={() => setCrearAbierto(false)}>
          <form className="dashboard-form" style={{ flexDirection: 'column', alignItems: 'stretch' }} onSubmit={crear}>
            <label className="form-field">
              Sección
              <select value={form.idSeccion} onChange={(e) => setForm({ ...form, idSeccion: e.target.value })} required>
                {secciones.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {etiquetaSeccion(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Nombre del grupo
              <input
                value={form.nombreGrupo}
                onChange={(e) => setForm({ ...form, nombreGrupo: e.target.value })}
                placeholder="Ej: Los Cohetes"
                maxLength={50}
                required
                autoFocus
              />
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setCrearAbierto(false)} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando ? 'Creando…' : 'Crear grupo'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmacion && (
        <Modal
          title={confirmacion.tipo === 'regenerar' ? 'Generar un código nuevo' : 'Desactivar grupo'}
          onClose={() => setConfirmacion(null)}
        >
          <p style={{ marginTop: 0 }}>
            {confirmacion.tipo === 'regenerar'
              ? `El código actual de "${confirmacion.grupo.nombreGrupo}" dejará de funcionar de inmediato, y quien esté dentro con ese código tendrá que entrar con el nuevo.`
              : `"${confirmacion.grupo.nombreGrupo}" ya no podrá entrar. Sus resultados se conservan.`}
          </p>
          {formError && <p className="form-error">{formError}</p>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setConfirmacion(null)} disabled={guardando}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={confirmar} disabled={guardando}>
              {guardando ? 'Un momento…' : confirmacion.tipo === 'regenerar' ? 'Generar código' : 'Desactivar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
