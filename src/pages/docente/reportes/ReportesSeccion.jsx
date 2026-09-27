import { useState } from 'react';
import useCarga from '../../../hooks/useCarga';
import actividadesService from '../../../services/actividadesService';
import gruposService from '../../../services/gruposService';
import { etiquetaSeccion } from './formato';
import PanelReporte from './PanelReporte';
import './reportes-seccion.css';

// Secciones donde el docente tiene grupos (las únicas de las que puede ver
// resultados) y los módulos activos, para armar los dos filtros.
async function cargarFiltros() {
  const [grupos, modulos] = await Promise.all([
    gruposService.listarMisGrupos(),
    actividadesService.listarModulos(),
  ]);
  const fallo = [grupos, modulos].find((r) => !r.success);
  if (fallo) return fallo;

  const secciones = new Map();
  for (const g of grupos.data) {
    if (g.seccion) secciones.set(g.seccion.id, g.seccion);
  }
  return {
    success: true,
    data: {
      secciones: [...secciones.values()].sort((a, b) => etiquetaSeccion(a).localeCompare(etiquetaSeccion(b))),
      modulos: [...modulos.data].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    },
  };
}

export default function ReportesSeccion() {
  const { datos, error, cargando, recargar } = useCarga(cargarFiltros);
  const [seccionElegida, setSeccionElegida] = useState('');
  const [moduloElegido, setModuloElegido] = useState('');

  if (cargando) return <p className="cargando">Cargando…</p>;

  if (error) {
    return (
      <div className="panel estado-vacio">
        <span className="estado-emoji">📡</span>
        <p>{error}</p>
        <button className="btn-secondary" onClick={recargar}>Reintentar</button>
      </div>
    );
  }

  if (datos.secciones.length === 0) {
    return (
      <div className="panel estado-vacio">
        <span className="estado-emoji">🎒</span>
        <h3>Todavía no tienes grupos</h3>
        <p>Crea un grupo en la pestaña Grupos; cuando resuelva actividades podrás generar sus reportes aquí.</p>
      </div>
    );
  }

  // Por defecto, la primera sección y el primer módulo de su grado. Si se
  // cambia de sección y el módulo elegido no es de ese grado, se toma el primero.
  const seccion = datos.secciones.find((s) => String(s.id) === seccionElegida) ?? datos.secciones[0];
  const idGrado = seccion.idGrado ?? seccion.grado?.id;
  const modulos = datos.modulos.filter((m) => m.idGrado === idGrado);
  const modulo = modulos.find((m) => String(m.id) === moduloElegido) ?? modulos[0];

  return (
    <div className="pila-reportes">
      <div className="panel">
        <div className="section-actions" style={{ marginBottom: 0 }}>
          <div>
            <h3 className="panel-title" style={{ margin: 0 }}>Reportes por sección</h3>
            <p className="texto-suave">Elige la sección y el módulo que quieres revisar.</p>
          </div>
          <div className="filtros">
            <label className="form-field">
              Sección
              <select value={String(seccion.id)} onChange={(e) => setSeccionElegida(e.target.value)}>
                {datos.secciones.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {etiquetaSeccion(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Módulo
              <select
                value={modulo ? String(modulo.id) : ''}
                onChange={(e) => setModuloElegido(e.target.value)}
                disabled={modulos.length === 0}
              >
                {modulos.length === 0 && <option value="">Sin módulos para este grado</option>}
                {modulos.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.icono ? `${m.icono} ` : ''}
                    {m.nombreModulo}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {modulo ? (
        <PanelReporte key={`${seccion.id}-${modulo.id}`} seccion={seccion} modulo={modulo} />
      ) : (
        <div className="panel estado-vacio">
          <span className="estado-emoji">🧩</span>
          <p>El grado de esta sección todavía no tiene módulos.</p>
        </div>
      )}
    </div>
  );
}
