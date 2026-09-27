import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import './DashboardLayout.css';
import '../components/dashboard/widgets.css';

const COLORES_MENU = ['var(--orange)', 'var(--teal)', 'var(--sun)', 'var(--grape)', 'var(--sky)', 'var(--leaf)'];

const ETIQUETA_ROL = {
  administrador: 'Administración',
  docente: 'Docente',
};

function iniciales(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

const fechaTexto = new Intl.DateTimeFormat('es-GT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date());
const fechaHoy = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

export default function DashboardLayout({ menuItems }) {
  const { user, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState(menuItems[0]?.label ?? '');
  const itemActivo = menuItems.find((item) => item.label === seleccionado);
  const primerNombre = user?.nombre?.split(' ')[0];

  const seleccionar = (label) => {
    setSeleccionado(label);
    setMenuAbierto(false);
  };

  return (
    <div className={`dashboard-layout ${menuAbierto ? 'menu-abierto' : ''}`}>
      <aside className="sidebar" aria-label="Menú principal">
        <div className="sidebar-header">
          <span className="sidebar-logo-tile">
            <img src={logo} alt="" className="sidebar-logo" />
          </span>
          <span className="sidebar-brand">
            Educ<span>Analítica</span>
          </span>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              className={`sidebar-item ${seleccionado === item.label ? 'active' : ''}`}
              style={{ '--item-color': item.color ?? COLORES_MENU[i % COLORES_MENU.length] }}
              onClick={() => seleccionar(item.label)}
              aria-current={seleccionado === item.label ? 'page' : undefined}
            >
              {item.icon && <span className="sidebar-icon">{item.icon}</span>}
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={logout}>
          <span className="sidebar-icon">👋</span>
          <span className="sidebar-label">Cerrar sesión</span>
        </button>
      </aside>

      <div className="sidebar-scrim" onClick={() => setMenuAbierto(false)} aria-hidden="true" />

      <main className="dashboard-content">
        <header className="dashboard-topbar">
          <button
            className="sidebar-toggle"
            onClick={() => setMenuAbierto((o) => !o)}
            aria-label="Mostrar u ocultar menú"
          >
            ☰
          </button>

          <div className="dashboard-heading">
            <span className="dashboard-greeting">
              {primerNombre ? `¡Hola, ${primerNombre}!` : '¡Hola!'} · <span>{fechaHoy}</span>
            </span>
            <h1 className="dashboard-title">
              {itemActivo?.icon && <span aria-hidden="true">{itemActivo.icon}</span>}
              {seleccionado}
            </h1>
          </div>

          <div className="dashboard-user">
            <span className="dashboard-role">{ETIQUETA_ROL[user?.rol] ?? user?.rol}</span>
            <span className="dashboard-avatar" aria-hidden="true">
              {iniciales(user?.nombre) || '🙂'}
            </span>
          </div>
        </header>

        <section className="dashboard-body">
          {itemActivo?.content ?? <p>Contenido de "{seleccionado}" próximamente.</p>}
        </section>
      </main>
    </div>
  );
}
