import DashboardLayout from '../components/DashboardLayout';
import InicioAdmin from './admin/InicioAdmin';
import UsuariosAdmin from './admin/UsuariosAdmin';
import ReportesAdmin from './admin/ReportesAdmin';
import ConfiguracionAdmin from './admin/ConfiguracionAdmin';

const MENU_ADMIN = [
  { label: 'Inicio', icon: '🏠', content: <InicioAdmin /> },
  { label: 'Usuarios', icon: '👤', content: <UsuariosAdmin /> },
  { label: 'Reportes', icon: '📄', content: <ReportesAdmin /> },
  { label: 'Configuración', icon: '⚙️', content: <ConfiguracionAdmin /> },
];

export default function Admin() {
  return <DashboardLayout menuItems={MENU_ADMIN} />;
}
