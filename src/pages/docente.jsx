import DashboardLayout from '../components/DashboardLayout';
import InicioDocente from './docente/InicioDocente';
import Grupos from './docente/Grupos';
import ActividadesDocente from './docente/ActividadesDocente';
import ReportesDocente from './docente/ReportesDocente';

const MENU_DOCENTE = [
  { label: 'Inicio', icon: '🏠', content: <InicioDocente /> },
  { label: 'Grupos', icon: '🎒', content: <Grupos /> },
  { label: 'Actividades', icon: '🧩', content: <ActividadesDocente /> },
  { label: 'Reportes', icon: '📄', content: <ReportesDocente /> },
];

export default function Docente() {
  return <DashboardLayout menuItems={MENU_DOCENTE} />;
}
