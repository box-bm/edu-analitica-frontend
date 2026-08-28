import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo2.png';
import './DashboardLayout.css';

export default function DashboardLayout({ menuItems, children }) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState(menuItems[0]?.label ?? '');

  return (
    <div className="dashboard-layout">
      <aside
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="sidebar-header">
          <button
            className="sidebar-toggle"
            onClick={() => setIsOpen((o) => !o)}
            aria-label="Mostrar u ocultar menú"
          >
            ☰
          </button>
          <img src={logo} alt="EducAnalítica" className="sidebar-logo" />
          <span className="sidebar-brand"></span>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`sidebar-item ${seleccionado === item.label ? 'active' : ''}`}
              onClick={() => setSeleccionado(item.label)}
            >
              {item.icon && <span className="sidebar-icon">{item.icon}</span>}
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={logout}>
          <span className="sidebar-icon">⏻</span>
          <span className="sidebar-label">Cerrar sesión</span>
        </button>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-topbar">
          <h1 className="dashboard-title">{seleccionado}</h1>
          <span className="dashboard-role">
            Sesión: <strong>{user?.rol}</strong>
          </span>
        </header>

        <section className="dashboard-body">
          {children ?? <p>Contenido de "{seleccionado}" próximamente.</p>}
        </section>
      </main>
    </div>
  );
}