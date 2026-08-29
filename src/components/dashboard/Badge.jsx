const COLORES = {
  Excelente: '#16a34a',
  Bueno: '#2563eb',
  Regular: '#f59e0b',
  Bajo: '#dc2626',
  Activo: '#16a34a',
  Inactivo: '#94a3b8',
  Admin: '#7c3aed',
  Docente: '#2563eb',
  Estudiante: '#16a34a',
};

export default function Badge({ children }) {
  const color = COLORES[children] ?? '#64748b';
  return (
    <span className="badge" style={{ backgroundColor: `${color}1a`, color }}>
      {children}
    </span>
  );
}
