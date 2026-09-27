export default function Estrellas({ cantidad, grande = false }) {
  return (
    <span
      className={`estrellas ${grande ? 'estrellas-grandes' : ''}`}
      role="img"
      aria-label={`${cantidad} de 3 estrellas`}
    >
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= cantidad ? 'estrella llena' : 'estrella'}>
          ★
        </span>
      ))}
    </span>
  );
}
