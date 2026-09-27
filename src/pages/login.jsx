import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import './login.css';

const FIGURAS = ['+', '×', '3', '★', '÷', '7', '●', '▲'];

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
      case 'docente':
        navigate('/docente');
        break;
      case 'administrador':
        navigate('/admin');
        break;
      default:
        navigate('/no-autorizado');
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero" aria-hidden="true">
        {FIGURAS.map((f, i) => (
          <span key={i} className={`login-figura figura-${i}`}>
            {f}
          </span>
        ))}
        <div className="login-hero-texto">
          <img src={logo} alt="" className="login-hero-logo" />
          <h2>
            Aprender jugando,
            <br />
            <span>crecer sumando.</span>
          </h2>
          <p>Matemática y computación para 1ro, 2do y 3ro primaria.</p>
        </div>
      </section>

      <section className="login-lado">
        <div className="login-card">
          <div className="login-header">
            <h1>
              Educ<span>Analítica</span>
            </h1>
            <p>Ingreso para docentes y administración</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="login-usuario">Usuario</label>
              <input
                id="login-usuario"
                type="text"
                placeholder="tu.usuario"
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <Link to="/grupo" className="login-estudiantes">
          <span className="login-estudiantes-emoji" aria-hidden="true">
            🎒
          </span>
          <span>
            <strong>¿Eres estudiante?</strong>
            <small>Entra con el código de tu grupo</small>
          </span>
          <span className="login-estudiantes-flecha" aria-hidden="true">
            →
          </span>
        </Link>
      </section>
    </div>
  );
}

export default Login;
