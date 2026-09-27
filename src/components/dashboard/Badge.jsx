const COLORES = {
  Activo: '#3aa55c',
  Inactivo: '#8390a8',
  Admin: '#8a63f0',
  Docente: '#149e94',
  Catálogo: '#8a63f0',
  Propia: '#f2663a',
};

export default function Badge({ children }) {
  const color = COLORES[children] ?? '#4b5a7a';
  return (
    <span className="badge" style={{ backgroundColor: `${color}1a`, color }}>
      {children}
    </span>
  );
}
