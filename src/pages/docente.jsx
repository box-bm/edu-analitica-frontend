import DashboardLayout from '../components/DashboardLayout';
import InicioDocente from './docente/InicioDocente';
import CursosDocente from './docente/CursosDocente';
import EstudiantesDocente from './docente/EstudiantesDocente';
import ReportesDocente from './docente/ReportesDocente';

const MENU_DOCENTE = [
  { label: 'Inicio', icon: '🏠', content: <InicioDocente /> },
  { label: 'Cursos', icon: '📚', content: <CursosDocente /> },
  { label: 'Estudiantes', icon: '👥', content: <EstudiantesDocente /> },
  { label: 'Reportes', icon: '📄', content: <ReportesDocente /> },
];

export default function Docente() {
  return <DashboardLayout menuItems={MENU_DOCENTE} />;
}
