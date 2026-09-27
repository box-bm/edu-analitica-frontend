import useCarga from '../../hooks/useCarga';
import ReporteActividades from '../../components/reportes/ReporteActividades';
import seccionesService from '../../services/seccionesService';

const cargarGrados = () => seccionesService.listarGradosConSecciones();

// Mismo reporte que admin, pero el backend lo limita a los grupos del docente.
export default function ReportesDocente() {
  const { datos: grados } = useCarga(cargarGrados);
  return <ReporteActividades grados={grados ?? []} />;
}
