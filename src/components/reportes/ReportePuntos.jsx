import { useCallback, useState } from 'react';
import useCarga from '../../hooks/useCarga';
import reportesService from '../../services/reportesService';
import StatCard from '../dashboard/StatCard';
import { urlImagen } from '../../utils/imagenes';
import './reportes.css';

const nivelClase = (p) => (p >= 90 ? 'alto' : p >= 60 ? 'medio' : 'inicial');

const unicos = (items, clave) => [...new Map(items.map((x) => [clave(x), x])).values()];

// Puntos de las actividades por grupo y módulo. Son un complemento visual del
// desempeño dentro de EduAnalítica, no una calificación: la analítica sigue
// siendo aciertos, intentos y avance. Cada actividad aporta su mejor intento.
export default function ReportePuntos({ grados = [], ciclos = [] }) {
  const [filtro, setFiltro] = useState({ idGrado: '', ciclo: '', idSeccion: '', idGrupo: '', idModulo: '', idActividad: '' });
  const cambiar = (campo, valor) =>
    setFiltro((f) => {
      const nuevo = { ...f, [campo]: valor };
      // Cambiar el grado o la sección invalida lo que cuelga de ellos.
      if (campo === 'idGrado' || campo === 'ciclo') Object.assign(nuevo, { idSeccion: '', idGrupo: '', idModulo: '', idActividad: '' });
      if (campo === 'idSeccion') nuevo.idGrupo = '';
      if (campo === 'idModulo') nuevo.idActividad = '';
      return nuevo;
    });

  const base = { idGrado: filtro.idGrado || undefined, ciclo: filtro.ciclo || undefined };
  // Opciones de los filtros: todo lo que hay en el grado/ciclo elegido.
  const cargarOpciones = useCallback(
    () => Promise.all([reportesService.puntos(base), reportesService.porActividad(base)]).then(([p, a]) =>
      p.success && a.success ? { success: true, data: { puntos: p.data, actividades: a.data.actividades } } : p.success ? a : p
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtro.idGrado, filtro.ciclo]
  );
  const cargar = useCallback(
    () =>
      reportesService.puntos({
        ...base,
        idSeccion: filtro.idSeccion || undefined,
        idGrupo: filtro.idGrupo || undefined,
        idModulo: filtro.idModulo || undefined,
        idActividad: filtro.idActividad || undefined,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtro]
  );
  const opciones = useCarga(cargarOpciones);
  const { datos, error, cargando, recargar } = useCarga(cargar);

  const grupos = opciones.datos?.puntos.grupos ?? [];
  const secciones = unicos(grupos, (g) => g.idSeccion);
  const gruposFiltro = grupos.filter((g) => !filtro.idSeccion || String(g.idSeccion) === filtro.idSeccion);
  const modulos = unicos(grupos.flatMap((g) => g.modulos), (m) => m.idModulo);
  const moduloElegido = modulos.find((m) => String(m.idModulo) === filtro.idModulo);
  const actividades = (opciones.datos?.actividades ?? []).filter((a) => !moduloElegido || a.modulo === moduloElegido.modulo);

  const select = (campo, etiqueta, todos, items, valor, texto) => (
    <select className="form-field" value={filtro[campo]} onChange={(e) => cambiar(campo, e.target.value)} aria-label={etiqueta}>
      <option value="">{todos}</option>
      {items.map((x) => (
        <option key={valor(x)} value={String(valor(x))}>
          {texto(x)}
        </option>
      ))}
    </select>
  );

  return (
    <div>
      <div className="panel">
        <div className="section-actions">
          <div>
            <h3 className="panel-title" style={{ margin: 0 }}>Puntos por grupo y módulo</h3>
            <p className="texto-suave">
              Puntos complementarios de las actividades (máx. 100 por actividad, su mejor intento). No son una
              calificación.
            </p>
          </div>
        </div>
        <div className="filtros filtros-puntos">
          {ciclos.length > 1 && select('ciclo', 'Filtrar por ciclo escolar', 'Todos los ciclos', ciclos, (c) => c, (c) => `Ciclo ${c}`)}
          {grados.length > 0 && select('idGrado', 'Filtrar por grado', 'Todos los grados', grados, (g) => g.id, (g) => g.nombreGrado)}
          {select('idSeccion', 'Filtrar por sección', 'Todas las secciones', secciones, (g) => g.idSeccion, (g) => `${g.grado ?? ''} ${g.seccion ?? ''}${g.ciclo ? ` (${g.ciclo})` : ''}`)}
          {select('idGrupo', 'Filtrar por grupo', 'Todos los grupos', gruposFiltro, (g) => g.idGrupo, (g) => g.nombreGrupo)}
          {select('idModulo', 'Filtrar por módulo', 'Todos los módulos', modulos, (m) => m.idModulo, (m) => m.modulo)}
          {select('idActividad', 'Filtrar por actividad', 'Todas las actividades', actividades, (a) => a.idActividad, (a) => a.titulo)}
        </div>
      </div>

      {cargando ? (
        <p className="cargando">Cargando puntos…</p>
      ) : error ? (
        <div className="panel estado-vacio">
          <p>{error}</p>
          <button className="btn-secondary" onClick={recargar}>Reintentar</button>
        </div>
      ) : datos.grupos.length === 0 ? (
        <div className="panel estado-vacio">
          <span className="estado-emoji">⭐</span>
          <h3>Aún no hay puntos con este filtro</h3>
          <p>Cuando los grupos terminen actividades, verás aquí sus puntos por módulo.</p>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <StatCard label="Grupos" value={datos.totales.grupos} accent="var(--orange)" />
            <StatCard
              label="Puntos acumulados"
              value={`${datos.totales.puntosAcumulados} / ${datos.totales.puntosPosibles}`}
              accent="var(--sun)"
            />
            <StatCard label="Promedio de actividades" value={`${datos.totales.promedio} %`} accent="var(--teal)" />
            <StatCard label="Intentos" value={datos.totales.intentos} accent="var(--grape)" />
          </div>

          {datos.grupos.map((g) => (
            <section key={g.idGrupo} className="panel puntos-grupo">
              <header className="puntos-grupo-cabecera">
                <dl>
                  <div>
                    <dt>Grupo</dt>
                    <dd>{g.nombreGrupo}</dd>
                  </div>
                  <div>
                    <dt>Grado</dt>
                    <dd>{g.grado}</dd>
                  </div>
                  <div>
                    <dt>Sección</dt>
                    <dd>{g.seccion}</dd>
                  </div>
                </dl>
                <span className="puntos-total">
                  {g.puntosAcumulados} <small>/ {g.puntosPosibles} pts</small>
                </span>
              </header>

              <div className="puntos-modulos">
                {g.modulos.map((m) => (
                  <article key={m.idModulo} className="puntos-modulo">
                    <div className="puntos-modulo-titulo">
                      {m.imagen ? <img src={urlImagen(m.imagen)} alt="" /> : <span aria-hidden="true">{m.icono ?? '📘'}</span>}
                      <h4>{m.modulo}</h4>
                    </div>
                    <p>
                      Puntos acumulados: <b>{m.puntosAcumulados} / {m.puntosPosibles}</b>
                    </p>
                    <span className={`progreso nivel-${nivelClase(m.promedio)}`}>
                      <span style={{ width: `${m.promedio}%` }} />
                    </span>
                    <p>
                      Promedio de actividades: <b>{m.promedio} %</b>
                    </p>
                    <p className="texto-suave">
                      Actividades realizadas: {m.actividadesRealizadas} · Intentos: {m.intentos}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
