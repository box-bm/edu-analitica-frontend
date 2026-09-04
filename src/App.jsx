import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';

import Login from './pages/login';
import Admin from './pages/admin';
import Docente from './pages/docente';
import Estudiante from './pages/estudiante';
import NoAutorizado from './pages/NoAutorizado';
import NotFound from './pages/NotFound';

function RutaInicio() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <p>Cargando...</p>;

  if (isAuthenticated) {
    switch (user.rol) {
      case 'estudiante':
        return <Navigate to="/estudiante" replace />;
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
        path="/estudiante"
        element={
          <PrivateRoute allowedRoles={['estudiante']}>
            <Estudiante />
          </PrivateRoute>
        }
      />

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

      <Route path="/no-autorizado" element={<NoAutorizado />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;