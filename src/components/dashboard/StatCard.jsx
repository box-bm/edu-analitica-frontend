export default function StatCard({ label, value, hint, accent = 'var(--teal)' }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
      {hint && <span className="stat-card-hint">{hint}</span>}
    </div>
  );
}
