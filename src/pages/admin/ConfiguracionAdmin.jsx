import { useState } from 'react';

export default function ConfiguracionAdmin() {
  const [form, setForm] = useState({
    institucion: 'Colegio EduAnalítica',
    anioEscolar: '2026',
    notificaciones: true,
  });
  const [guardado, setGuardado] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setGuardado(true);
  };

  return (
    <div className="panel" style={{ maxWidth: 480 }}>
      <h3 className="panel-title">Configuración de la institución</h3>
      <form className="dashboard-form" style={{ flexDirection: 'column', alignItems: 'stretch' }} onSubmit={handleSubmit}>
        <label className="form-field">
          Nombre de la institución
          <input
            value={form.institucion}
            onChange={(e) => setForm({ ...form, institucion: e.target.value })}
          />
        </label>
        <label className="form-field">
          Año escolar
          <input value={form.anioEscolar} onChange={(e) => setForm({ ...form, anioEscolar: e.target.value })} />
        </label>
        <label className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={form.notificaciones}
            onChange={(e) => setForm({ ...form, notificaciones: e.target.checked })}
            style={{ minWidth: 'auto' }}
          />
          Enviar notificaciones a docentes y estudiantes
        </label>
        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
          Guardar cambios
        </button>
        {guardado && <p className="form-feedback">Cambios guardados (simulado).</p>}
      </form>
    </div>
  );
}
