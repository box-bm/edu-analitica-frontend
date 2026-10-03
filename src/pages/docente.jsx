import { House, Backpack, Puzzle, FileChartColumn } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import InicioDocente from './docente/InicioDocente';
import Grupos from './docente/Grupos';
import ActividadesDocente from './docente/ActividadesDocente';
import ReportesDocente from './docente/ReportesDocente';

const MENU_DOCENTE = [
  { label: 'Inicio', icon: House, content: <InicioDocente /> },
  { label: 'Grupos', icon: Backpack, content: <Grupos /> },
  { label: 'Actividades', icon: Puzzle, content: <ActividadesDocente /> },
  { label: 'Reportes', icon: FileChartColumn, content: <ReportesDocente /> },
];

export default function Docente() {
  return <DashboardLayout menuItems={MENU_DOCENTE} />;
}
