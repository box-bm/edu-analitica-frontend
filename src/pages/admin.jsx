import { House, Users, School, FileChartColumn } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import InicioAdmin from './admin/InicioAdmin';
import UsuariosAdmin from './admin/UsuariosAdmin';
import SeccionesAdmin from './admin/SeccionesAdmin';
import ReportesAdmin from './admin/ReportesAdmin';

const MENU_ADMIN = [
  { label: 'Inicio', icon: House, content: <InicioAdmin /> },
  { label: 'Usuarios', icon: Users, content: <UsuariosAdmin /> },
  { label: 'Secciones', icon: School, content: <SeccionesAdmin /> },
  { label: 'Reportes', icon: FileChartColumn, content: <ReportesAdmin /> },
];

export default function Admin() {
  return <DashboardLayout menuItems={MENU_ADMIN} />;
}
