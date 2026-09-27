const COLORES = {
  Excelente: '#3aa55c',
  Bueno: '#149e94',
  Regular: '#e6a100',
  Bajo: '#f2663a',
  Activo: '#3aa55c',
  Inactivo: '#8390a8',
  Admin: '#8a63f0',
  Docente: '#149e94',
  Estudiante: '#3aa55c',
  Catálogo: '#8a63f0',
  Propia: '#f2663a',
  Completada: '#3aa55c',
};

export default function Badge({ children }) {
  const color = COLORES[children] ?? '#4b5a7a';
  return (
    <span className="badge" style={{ backgroundColor: `${color}1a`, color }}>
      {children}
    </span>
  );
}
