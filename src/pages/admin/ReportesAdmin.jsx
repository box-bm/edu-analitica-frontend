import Reportes from '../../components/reportes/Reportes';

// Admin lee todos los reportes pero no registra PDFs (src/utils/permisos.js).
export default function ReportesAdmin() {
  return <Reportes />;
}
