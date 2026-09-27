import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import useCarga from '../../../hooks/useCarga';
import actividadesService from '../../../services/actividadesService';
import gruposService from '../../../services/gruposService';
import seccionesService from '../../../services/seccionesService';
import { permisosReportes } from '../../../utils/permisos';
import { etiquetaSeccion } from './formato';
import PanelReporte from './PanelReporte';
import './reportes-seccion.css';

// Secciones donde el usuario tiene grupos (docente: las únicas de las que
// puede ver resultados; el backend responde 403 en las demás).
async function seccionesPropias() {
  const result = await gruposService.listarMisGrupos();
  if (!result.success) return result;
  const secciones = new Map();
  for (const g of result.data) {
    if (g.seccion) secciones.set(g.seccion.id, g.seccion);
  }
  return { success: true, data: [...secciones.values()] };
}

async function seccionesActivas() {
  const result = await seccionesService.listarSecciones();
  if (!result.success) return result;
  return { success: true, data: result.data.filter((s) => s.activa) };
}

// Cargadores a nivel de módulo para que useCarga reciba una referencia estable.
const cargarFiltros = (cargarSecciones) => async () => {
  const [secciones, modulos] = await Promise.all([cargarSecciones(), actividadesService.listarModulos()]);
  const fallo = [secciones, modulos].find((r) => !r.success);
  if (fallo) return fallo;
  return {
    success: true,
    data: {
      secciones: [...secciones.data].sort((a, b) => etiquetaSeccion(a).localeCompare(etiquetaSeccion(b))),
      modulos: [...modulos.data].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    },
  };
};

const CARGADORES = {
  propias: cargarFiltros(seccionesPropias),
  todas: cargarFiltros(seccionesActivas),
};

export default function ReportesSeccion() {
  const { user } = useAuth();
  const permisos = permisosReportes(user?.rol);
  const { datos, error, cargando, recargar } = useCarga(CARGADORES[permisos.secciones]);
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
    return permisos.secciones === 'propias' ? (
      <div className="panel estado-vacio">
        <span className="estado-emoji">🎒</span>
        <h3>Todavía no tienes grupos</h3>
        <p>Crea un grupo en la pestaña Grupos; cuando resuelva actividades podrás generar sus reportes aquí.</p>
      </div>
    ) : (
      <div className="panel estado-vacio">
        <span className="estado-emoji">🏫</span>
        <h3>No hay secciones activas</h3>
        <p>Crea una sección en la pestaña Secciones para ver sus reportes.</p>
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
        <PanelReporte
          key={`${seccion.id}-${modulo.id}`}
          seccion={seccion}
          modulo={modulo}
          puedeRegistrar={permisos.registrar}
        />
      ) : (
        <div className="panel estado-vacio">
          <span className="estado-emoji">🧩</span>
          <p>El grado de esta sección todavía no tiene módulos.</p>
        </div>
      )}
    </div>
  );
}
