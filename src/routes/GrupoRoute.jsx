import { Navigate } from 'react-router-dom';
import { useGrupo } from '../context/GrupoContext';
import GrupoLayout from '../components/GrupoLayout';

// Rutas de la zona de niños: requieren una sesión de grupo activa (token en
// memoria). Sin ella —reload, token vencido o código regenerado— vuelven a
// la pantalla del código.
export default function GrupoRoute({ children }) {
  const { activo } = useGrupo();

  if (!activo) {
    return <Navigate to="/grupo" replace />;
  }

  return <GrupoLayout>{children}</GrupoLayout>;
}
