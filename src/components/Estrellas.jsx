import { TOTAL_ESTRELLAS } from '../utils/estrellas';

export default function Estrellas({ cantidad, grande = false }) {
  return (
    <span
      className={`estrellas ${grande ? 'estrellas-grandes' : ''}`}
      role="img"
      aria-label={`${cantidad} de ${TOTAL_ESTRELLAS} estrellas`}
    >
      {Array.from({ length: TOTAL_ESTRELLAS }, (_, i) => i + 1).map((n) => (
        <span key={n} className={n <= cantidad ? 'estrella llena' : 'estrella'}>
          ★
        </span>
      ))}
    </span>
  );
}
