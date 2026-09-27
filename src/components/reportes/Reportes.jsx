import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import useCarga from '../../hooks/useCarga';
import seccionesService from '../../services/seccionesService';
import { permisosReportes } from '../../utils/permisos';
import ReporteActividades from './ReporteActividades';
import ReportesSeccion from './seccion/ReportesSeccion';
import './seccion/reportes-seccion.css';

const cargarGrados = () => seccionesService.listarGradosConSecciones();

const VISTAS = [
  { id: 'seccion', label: 'Por sección y módulo' },
  { id: 'actividad', label: 'Aciertos por actividad' },
];

// Pestaña Reportes de admin y docente. "Por sección" es el flujo del Módulo 4
// (vista previa, CSV para Colab, PDFs registrados) y solo aparece si el rol
// tiene permiso (src/utils/permisos.js). "Por actividad" es el reporte
// general; el backend lo limita a los grupos del docente.
export default function Reportes() {
  const { user } = useAuth();
  const { ver } = permisosReportes(user?.rol);
  const [vista, setVista] = useState('seccion');
  const { datos: grados } = useCarga(cargarGrados);

  const porActividad = <ReporteActividades grados={grados ?? []} />;
  if (!ver) return porActividad;

  return (
    <div>
      <div className="selector-vista" role="group" aria-label="Tipo de reporte">
        {VISTAS.map((v) => (
          <button key={v.id} type="button" aria-pressed={vista === v.id} onClick={() => setVista(v.id)}>
            {v.label}
          </button>
        ))}
      </div>
      {vista === 'seccion' ? <ReportesSeccion /> : porActividad}
    </div>
  );
}
