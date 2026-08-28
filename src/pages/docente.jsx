import DashboardLayout from '../components/DashboardLayout';

const MENU_DOCENTE = [
  { label: 'Inicio', icon: '🏠' },
  { label: 'Cursos', icon: '📚' },
  { label: 'Estudiantes', icon: '👥' },
  { label: 'Reportes', icon: '📄' },
];

export default function Estudiante() {
  return <DashboardLayout menuItems={MENU_DOCENTEE} />;
}