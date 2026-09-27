import Reportes from '../../components/reportes/Reportes';

// Mismo componente que admin; el backend limita todo a los grupos del docente
// y src/utils/permisos.js decide qué puede hacer cada rol.
export default function ReportesDocente() {
  return <Reportes />;
}
