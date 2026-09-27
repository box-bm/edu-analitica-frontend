import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useGrupo } from '../../context/GrupoContext';
import logo from '../../assets/logo.png';
import './grupo.css';

const LONGITUD = 6;

// El backend genera códigos sin O/0/I/1/L; aquí solo se limpia lo que se
// escribe (mayúsculas, sin espacios ni símbolos).
const limpiar = (texto) =>
  texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, LONGITUD);

export default function AccesoGrupo() {
  const { activo, expirada, entrar } = useGrupo();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (activo) {
    return <Navigate to="/grupo/modulos" replace />;
  }

  const enviar = async (e) => {
    e.preventDefault();
    if (codigo.length !== LONGITUD) return;

    setEnviando(true);
    setError(null);
    const result = await entrar(codigo);
    setEnviando(false);

    if (result.success) {
      navigate('/grupo/modulos', { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="acceso-page">
      <div className="acceso-card">
        <img src={logo} alt="" className="acceso-logo" />
        <h1>¡Hola, equipo!</h1>
        <p className="acceso-instruccion">Escriban el código de su grupo</p>

        {expirada && !error && (
          <p className="acceso-aviso">⏰ Se acabó el tiempo. Escriban su código otra vez.</p>
        )}

        <form onSubmit={enviar}>
          <label className="sr-only" htmlFor="codigo-grupo">
            Código del grupo
          </label>
          <div className="codigo-cajas">
            <input
              id="codigo-grupo"
              className="codigo-input"
              value={codigo}
              onChange={(e) => {
                setCodigo(limpiar(e.target.value));
                setError(null);
              }}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              maxLength={LONGITUD}
              autoFocus
            />
            {Array.from({ length: LONGITUD }, (_, i) => (
              <span
                key={i}
                className={`codigo-caja ${codigo[i] ? 'llena' : ''} ${i === codigo.length ? 'actual' : ''}`}
                aria-hidden="true"
              >
                {codigo[i] ?? ''}
              </span>
            ))}
          </div>

          {error && <p className="acceso-aviso">🤔 {error}</p>}

          <button
            type="submit"
            className="boton-grande boton-naranja"
            disabled={codigo.length !== LONGITUD || enviando}
          >
            {enviando ? 'Entrando…' : '¡Entrar! 🚀'}
          </button>
        </form>
      </div>

      <Link to="/" className="acceso-docentes">
        Soy docente o administración
      </Link>
    </div>
  );
}
