export default function StatCard({ label, value, hint, accent = '#2563eb' }) {
  return (
    <div className="stat-card" style={{ borderTopColor: accent }}>
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
      {hint && <span className="stat-card-hint">{hint}</span>}
    </div>
  );
}
