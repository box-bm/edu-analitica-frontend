import useCarga from '../../hooks/useCarga';
import ReporteActividades from '../../components/reportes/ReporteActividades';
import seccionesService from '../../services/seccionesService';

const cargarGrados = () => seccionesService.listarGradosConSecciones();

export default function ReportesAdmin() {
  const { datos: grados } = useCarga(cargarGrados);
  return <ReporteActividades grados={grados ?? []} />;
}
