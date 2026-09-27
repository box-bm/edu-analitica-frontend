import { Link } from 'react-router-dom';
import './estudiante/grupo.css';

export default function NotFound() {
  return (
    <main className="acceso-page">
      <div className="acceso-card">
        <span className="grupo-mensaje-emoji" aria-hidden="true">🧭</span>
        <h1>Página no encontrada</h1>
        <p className="acceso-instruccion">Parece que esta página no existe.</p>
        <Link to="/" className="boton-grande boton-naranja">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
