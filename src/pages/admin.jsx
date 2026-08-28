import DashboardLayout from '../components/DashboardLayout';

const MENU_ADMIN = [
  { label: 'Inicio', icon: '🏠' },
  { label: 'Usuarios', icon: '👤' },
  { label: 'Reportes', icon: '📄' },
  { label: 'Configuración', icon: '⚙️' },
];
export default function Estudiante() {
  return <DashboardLayout menuItems={MENU_ADMIN} />;
}