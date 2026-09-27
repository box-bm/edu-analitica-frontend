import { useState } from 'react';
import reportesService from '../../../services/reportesService';
import { MAX_URL_PDF, esUrlPdfValida } from '../../../utils/urlPdf';

export default function RegistrarReporte({ idSeccion, idModulo, onRegistrado }) {
  const [urlPdf, setUrlPdf] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const registrar = async (e) => {
    e.preventDefault();
    setAviso(null);
    if (!esUrlPdfValida(urlPdf)) {
      setFormError('Pega un link completo que empiece con https:// (por ejemplo, el de Google Drive).');
      return;
    }

    setGuardando(true);
    setFormError(null);
    const result = await reportesService.registrar({ idSeccion, idModulo, urlPdf: urlPdf.trim() });
    setGuardando(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setUrlPdf('');
    setAviso('Reporte registrado. Ya aparece en el historial.');
    onRegistrado();
  };

  return (
    <form className="dashboard-form" onSubmit={registrar} noValidate>
      <label className="form-field" style={{ flex: '1 1 240px' }}>
        Link del PDF
        <input
          type="url"
          value={urlPdf}
          onChange={(e) => setUrlPdf(e.target.value)}
          placeholder="https://drive.google.com/…"
          maxLength={MAX_URL_PDF}
        />
      </label>
      <button type="submit" className="btn-primary" disabled={guardando || !urlPdf.trim()}>
        {guardando ? 'Guardando…' : 'Registrar'}
      </button>
      {formError && <p className="form-error" style={{ flexBasis: '100%' }}>{formError}</p>}
      {aviso && <p className="form-feedback" style={{ flexBasis: '100%' }}>{aviso}</p>}
      <p className="texto-suave" style={{ flexBasis: '100%', margin: 0 }}>
        Revisa que en Drive el archivo se pueda abrir con el link; si no, nadie más podrá verlo.
      </p>
    </form>
  );
}
