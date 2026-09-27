import { useNavigate } from 'react-router-dom';
import { useGrupo } from '../context/GrupoContext';
import '../pages/estudiante/grupo.css';

export default function GrupoLayout({ children }) {
  const { grupo, salir } = useGrupo();
  const navigate = useNavigate();

  const terminar = () => {
    salir();
    navigate('/grupo', { replace: true });
  };

  return (
    <div className="grupo-app">
      <header className="grupo-topbar">
        <button className="grupo-marca" onClick={() => navigate('/grupo/modulos')}>
          <span className="grupo-avatar" aria-hidden="true">
            🚀
          </span>
          <span>
            <strong>{grupo?.nombreGrupo}</strong>
            <small>
              {grupo?.grado} · Sección {grupo?.seccion}
            </small>
          </span>
        </button>
        <button className="grupo-salir" onClick={terminar}>
          Salir 👋
        </button>
      </header>
      <main className="grupo-main">{children}</main>
    </div>
  );
}
