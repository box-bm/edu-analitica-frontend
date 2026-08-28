import DashboardLayout from '../components/DashboardLayout';

const MENU_ESTUDIANTE = [
  { label: 'Inicio', icon: '🏠' },
  { label: 'Matemática', icon: '📐' },
  { label: 'Idiomática', icon: '📖' },
  { label: 'Resultados', icon: '📊' },
  { label: 'Reportes', icon: '📄' },
];

export default function Estudiante() {
  return <DashboardLayout menuItems={MENU_ESTUDIANTE} />;
}