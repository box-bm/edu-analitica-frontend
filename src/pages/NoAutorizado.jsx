import { Link } from 'react-router-dom';
import './estudiante/grupo.css';

export default function NoAutorizado() {
  return (
    <main className="acceso-page">
      <div className="acceso-card">
        <span className="grupo-mensaje-emoji" aria-hidden="true">🔒</span>
        <h1>Sin acceso</h1>
        <p className="acceso-instruccion">Tu usuario no tiene permiso para ver esta sección.</p>
        <Link to="/" className="boton-grande boton-teal">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
