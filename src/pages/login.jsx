import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';   // 👈 nuevo
import './login.css';

function Login() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ usuario, contraseña });

    if (result.success) {
      redirigirPorRol(result.user.rol);
    }
  };

  const redirigirPorRol = (rol) => {
    switch (rol) {
      case 'Estudiante':
        navigate('/estudiante');
        break;
      case 'Docente':
        navigate('/docente');
        break;
      case 'Admin':
        navigate('/admin');
        break;
      default:
        navigate('/no-autorizado');
    }
  };

  return (
    <div className="app-background">
      <div className="login-card">
        <div className="login-inner-border">

          <div className="login-header">
            <img src={logo} alt="EducAnalítica" className="login-logo" />
            <h1>EducAnalítica</h1>
            <p>Plataforma de aprendizaje básico</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Usuario</label>
              <input
                type="text"
                placeholder="carné / correo / usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="-------"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar a la plataforma'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

export default Login;