import { useState } from 'react';
import useCarga from '../../hooks/useCarga';
import ReporteActividades from '../../components/reportes/ReporteActividades';
import seccionesService from '../../services/seccionesService';
import ReportesSeccion from './reportes/ReportesSeccion';

const cargarGrados = () => seccionesService.listarGradosConSecciones();

const VISTAS = [
  { id: 'seccion', label: 'Por sección y módulo' },
  { id: 'actividad', label: 'Aciertos por actividad' },
];

function PorActividad() {
  const { datos: grados } = useCarga(cargarGrados);
  return <ReporteActividades grados={grados ?? []} />;
}

// "Por sección" es el flujo del Módulo 4 (vista previa, CSV para Colab,
// registro del PDF). "Por actividad" es el mismo reporte que ve admin, que
// el backend limita a los grupos del docente.
export default function ReportesDocente() {
  const [vista, setVista] = useState('seccion');

  return (
    <div>
      <div className="selector-vista" role="group" aria-label="Tipo de reporte">
        {VISTAS.map((v) => (
          <button key={v.id} type="button" aria-pressed={vista === v.id} onClick={() => setVista(v.id)}>
            {v.label}
          </button>
        ))}
      </div>
      {vista === 'seccion' ? <ReportesSeccion /> : <PorActividad />}
    </div>
  );
}
