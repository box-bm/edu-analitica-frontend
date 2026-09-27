import DashboardLayout from '../components/DashboardLayout';
import InicioEstudiante from './estudiante/InicioEstudiante';
import MateriaEstudiante from './estudiante/MateriaEstudiante';
import ResultadosEstudiante from './estudiante/ResultadosEstudiante';
import ReportesEstudiante from './estudiante/ReportesEstudiante';

const MENU_ESTUDIANTE = [
  { label: 'Inicio', icon: '🏠', content: <InicioEstudiante /> },
  { label: 'Matemática', icon: '📐', content: <MateriaEstudiante cursoId="mat" cursoNombre="Matemática" color="#149e94" /> },
  { label: 'Idiomática', icon: '📖', content: <MateriaEstudiante cursoId="idi" cursoNombre="Idiomática" color="#3aa55c" /> },
  { label: 'Resultados', icon: '📊', content: <ResultadosEstudiante /> },
  { label: 'Reportes', icon: '📄', content: <ReportesEstudiante /> },
];

export default function Estudiante() {
  return <DashboardLayout menuItems={MENU_ESTUDIANTE} />;
}
