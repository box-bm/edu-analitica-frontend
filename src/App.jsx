import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GrupoProvider } from './context/GrupoContext';
import PrivateRoute from './routes/PrivateRoute';
import GrupoRoute from './routes/GrupoRoute';

import Login from './pages/login';
import Admin from './pages/admin';
import Docente from './pages/docente';
import NoAutorizado from './pages/NoAutorizado';
import NotFound from './pages/NotFound';
import AccesoGrupo from './pages/estudiante/AccesoGrupo';
import SeleccionModulo from './pages/estudiante/SeleccionModulo';
import Actividad from './pages/estudiante/Actividad';
import Resultado from './pages/estudiante/Resultado';

function RutaInicio() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <p className="cargando pantalla-cargando">Cargando…</p>;

  if (isAuthenticated) {
    switch (user.rol) {
      case 'docente':
        return <Navigate to="/docente" replace />;
      case 'administrador':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/no-autorizado" replace />;
    }
  }

  return <Login />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RutaInicio />} />

      <Route
        path="/docente"
        element={
          <PrivateRoute allowedRoles={['docente']}>
            <Docente />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={['administrador']}>
            <Admin />
          </PrivateRoute>
        }
      />

      {/* Módulo 3: zona de grupos, con su propia sesión (GrupoContext), no AuthContext */}
      <Route path="/grupo" element={<AccesoGrupo />} />
      <Route path="/grupo/modulos" element={<GrupoRoute><SeleccionModulo /></GrupoRoute>} />
      <Route path="/grupo/modulos/:idModulo" element={<GrupoRoute><SeleccionModulo /></GrupoRoute>} />
      <Route path="/grupo/actividad/:idActividad" element={<GrupoRoute><Actividad /></GrupoRoute>} />
      <Route path="/grupo/resultado" element={<GrupoRoute><Resultado /></GrupoRoute>} />

      <Route path="/no-autorizado" element={<NoAutorizado />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <GrupoProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <AppRoutes />
        </Router>
      </GrupoProvider>
    </AuthProvider>
  );
}

export default App;