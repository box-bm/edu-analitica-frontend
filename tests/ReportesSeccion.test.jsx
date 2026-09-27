import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReportesSeccion from '../src/components/reportes/seccion/ReportesSeccion';
import actividadesService from '../src/services/actividadesService';
import gruposService from '../src/services/gruposService';
import reportesService from '../src/services/reportesService';
import seccionesService from '../src/services/seccionesService';

const auth = vi.hoisted(() => ({ rol: 'docente' }));
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 5, nombre: 'Ana Docente', rol: auth.rol } }),
}));

vi.mock('../src/services/gruposService', () => ({ default: { listarMisGrupos: vi.fn() } }));
vi.mock('../src/services/seccionesService', () => ({ default: { listarSecciones: vi.fn() } }));
vi.mock('../src/services/actividadesService', () => ({ default: { listarModulos: vi.fn() } }));
vi.mock('../src/services/reportesService', () => ({
  default: { vistaPrevia: vi.fn(), historial: vi.fn(), exportarCsv: vi.fn(), registrar: vi.fn() },
}));

const primeroA = { id: 10, idGrado: 1, nombreSeccion: 'A', grado: { id: 1, nombreGrado: '1ro Primaria' } };
const segundoB = { id: 20, idGrado: 2, nombreSeccion: 'B', grado: { id: 2, nombreGrado: '2do Primaria' } };

const grupos = [
  { id: 1, nombreGrupo: 'Leones', seccion: primeroA },
  { id: 2, nombreGrupo: 'Tigres', seccion: primeroA },
  { id: 3, nombreGrupo: 'Pumas', seccion: segundoB },
];

const modulos = [
  { id: 100, idGrado: 1, nombreModulo: 'Sumas', icono: '➕', orden: 1 },
  { id: 101, idGrado: 1, nombreModulo: 'Restas', icono: '➖', orden: 2 },
  { id: 200, idGrado: 2, nombreModulo: 'Teclado', icono: '⌨️', orden: 1 },
];

// Formas reales de edu-analitica-backend (feat/modulo-4-reportes).
const vistaConDatos = {
  seccion: { id: 10, nombreSeccion: 'A', grado: '1ro Primaria' },
  modulo: { id: 100, nombreModulo: 'Sumas', icono: '➕' },
  hayResultados: true,
  totales: { grupos: 2, intentos: 6, promedioPuntaje: 75 },
  grupos: [
    { idGrupo: 1, nombreGrupo: 'Leones', activo: true, intentos: 4, promedioPuntaje: 90, actividadesCompletadas: 3, actividadesDisponibles: 4, ultimoIntento: '2026-09-20T15:00:00Z' },
    { idGrupo: 2, nombreGrupo: 'Tigres', activo: false, intentos: 2, promedioPuntaje: 60, actividadesCompletadas: 1, actividadesDisponibles: 4, ultimoIntento: '2026-09-19T15:00:00Z' },
  ],
  mejorGrupo: { idGrupo: 1, nombreGrupo: 'Leones', promedioPuntaje: 90 },
  peorGrupo: { idGrupo: 2, nombreGrupo: 'Tigres', promedioPuntaje: 60 },
};

const vistaVacia = {
  ...vistaConDatos,
  hayResultados: false,
  totales: { grupos: 2, intentos: 0, promedioPuntaje: 0 },
  grupos: [],
  mejorGrupo: null,
  peorGrupo: null,
};

const reporte = {
  id: 7,
  urlPdf: 'https://drive.google.com/file/d/abc/view',
  generadoEn: '2026-09-20T15:00:00Z',
  seccion: { id: 10, nombreSeccion: 'A', grado: '1ro Primaria' },
  modulo: { id: 100, nombreModulo: 'Sumas' },
  docente: { id: 5, nombreCompleto: 'Ana Docente' },
};

const campoLink = () => screen.getByLabelText('Link del PDF');

describe('ReportesSeccion (Módulo 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.rol = 'docente';
    gruposService.listarMisGrupos.mockResolvedValue({ success: true, data: grupos });
    actividadesService.listarModulos.mockResolvedValue({ success: true, data: modulos });
    reportesService.vistaPrevia.mockResolvedValue({ success: true, data: vistaConDatos });
    reportesService.historial.mockResolvedValue({ success: true, data: [] });
  });

  it('defaults to the first sección and its first módulo, and loads preview + history for them', async () => {
    render(<ReportesSeccion />);
    expect(await screen.findByText('Mejor desempeño')).toBeInTheDocument();
    expect(reportesService.vistaPrevia).toHaveBeenCalledWith({ idSeccion: 10, idModulo: 100 });
    expect(reportesService.historial).toHaveBeenCalledWith({ idSeccion: 10, idModulo: 100 });
    // Sección sin duplicados aunque haya dos grupos en 1ro A.
    expect(within(screen.getByLabelText('Sección')).getAllByRole('option')).toHaveLength(2);
  });

  it('only offers módulos of the selected sección grado and refetches on change', async () => {
    render(<ReportesSeccion />);
    await screen.findByText('Mejor desempeño');
    expect(within(screen.getByLabelText('Módulo')).getAllByRole('option')).toHaveLength(2);

    await userEvent.selectOptions(screen.getByLabelText('Sección'), '20');

    const opciones = within(screen.getByLabelText('Módulo')).getAllByRole('option');
    expect(opciones.map((o) => o.textContent)).toEqual(['⌨️ Teclado']);
    expect(reportesService.vistaPrevia).toHaveBeenLastCalledWith({ idSeccion: 20, idModulo: 200 });
  });

  it('shows an empty state when the sección/módulo has no results yet', async () => {
    reportesService.vistaPrevia.mockResolvedValue({ success: true, data: vistaVacia });
    render(<ReportesSeccion />);
    expect(await screen.findByText('Aún no hay resultados')).toBeInTheDocument();
  });

  it('shows per-group stats with the real backend shape', async () => {
    render(<ReportesSeccion />);
    const fila = (await screen.findByText('Tigres', { selector: 'strong' })).closest('tr');
    expect(within(fila).getByText('(inactivo)')).toBeInTheDocument();
    expect(within(fila).getByText('1 de 4')).toBeInTheDocument();
    expect(within(fila).getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides best/worst when the backend sends no peorGrupo (only one group with attempts)', async () => {
    reportesService.vistaPrevia.mockResolvedValue({
      success: true,
      data: { ...vistaConDatos, peorGrupo: null },
    });
    render(<ReportesSeccion />);
    await screen.findByText('Promedio de aciertos');
    expect(screen.queryByText('Mejor desempeño')).not.toBeInTheDocument();
  });

  it('exports the CSV for the current filter', async () => {
    reportesService.exportarCsv.mockResolvedValue({ success: true });
    render(<ReportesSeccion />);
    await screen.findByText('Mejor desempeño');
    await userEvent.click(screen.getByRole('button', { name: /Exportar CSV/ }));
    expect(reportesService.exportarCsv).toHaveBeenCalledWith({ idSeccion: 10, idModulo: 100 });
  });

  it('rejects a link that is not http(s) without calling the API', async () => {
    render(<ReportesSeccion />);
    await screen.findByText('Mejor desempeño');

    await userEvent.type(campoLink(), 'mi reporte final');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findByText(/Pega un link completo/)).toBeInTheDocument();

    await userEvent.clear(campoLink());
    await userEvent.type(campoLink(), 'javascript:alert(1)');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(reportesService.registrar).not.toHaveBeenCalled();
  });

  it('registers a valid link for the current filter and reloads the history', async () => {
    reportesService.registrar.mockResolvedValue({ success: true, data: reporte });
    reportesService.historial.mockResolvedValueOnce({ success: true, data: [] }).mockResolvedValueOnce({ success: true, data: [reporte] });
    render(<ReportesSeccion />);
    await screen.findByText('Mejor desempeño');

    await userEvent.type(campoLink(), `  ${reporte.urlPdf} `);
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(reportesService.registrar).toHaveBeenCalledWith({ idSeccion: 10, idModulo: 100, urlPdf: reporte.urlPdf });
    const abrir = await screen.findByRole('link', { name: /Abrir PDF/ });
    expect(abrir).toHaveAttribute('href', reporte.urlPdf);
    expect(abrir).toHaveAttribute('target', '_blank');
    expect(abrir).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(abrir.closest('tr')).getByText('1ro Primaria · Sección A')).toBeInTheDocument();
    expect(within(abrir.closest('tr')).getByText('Ana Docente')).toBeInTheDocument();
    expect(campoLink()).toHaveValue('');
  });

  it('shows the backend validation message when registering fails', async () => {
    reportesService.registrar.mockResolvedValue({ success: false, error: 'La sección no pertenece a tus grupos' });
    render(<ReportesSeccion />);
    await screen.findByText('Mejor desempeño');

    await userEvent.type(campoLink(), reporte.urlPdf);
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByText('La sección no pertenece a tus grupos')).toBeInTheDocument();
  });

  it('never renders a stored non-http link as a clickable link', async () => {
    reportesService.historial.mockResolvedValue({
      success: true,
      data: [{ ...reporte, urlPdf: 'javascript:alert(1)' }],
    });
    render(<ReportesSeccion />);
    expect(await screen.findByText('Link no válido')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Abrir PDF/ })).not.toBeInTheDocument();
  });

  it('explains what to do when the docente has no groups yet', async () => {
    gruposService.listarMisGrupos.mockResolvedValue({ success: true, data: [] });
    render(<ReportesSeccion />);
    expect(await screen.findByText('Todavía no tienes grupos')).toBeInTheDocument();
    expect(reportesService.vistaPrevia).not.toHaveBeenCalled();
  });

  describe('as admin (read-only)', () => {
    beforeEach(() => {
      auth.rol = 'administrador';
      seccionesService.listarSecciones.mockResolvedValue({
        success: true,
        data: [primeroA, segundoB, { id: 30, idGrado: 3, nombreSeccion: 'C', activa: false, grado: { id: 3, nombreGrado: '3ro Primaria' } }].map(
          (s) => ({ activa: true, ...s })
        ),
      });
    });

    it('lists every active sección (not only own groups) and can preview, export and read history', async () => {
      reportesService.historial.mockResolvedValue({ success: true, data: [reporte] });
      render(<ReportesSeccion />);
      await screen.findByText('Mejor desempeño');

      expect(gruposService.listarMisGrupos).not.toHaveBeenCalled();
      expect(within(screen.getByLabelText('Sección')).getAllByRole('option')).toHaveLength(2);
      expect(screen.getByRole('button', { name: /Exportar CSV/ })).toBeInTheDocument();
      expect(await screen.findByRole('link', { name: /Abrir PDF/ })).toBeInTheDocument();
    });

    it('does not offer the register form', async () => {
      render(<ReportesSeccion />);
      await screen.findByText('Mejor desempeño');
      expect(screen.queryByLabelText('Link del PDF')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Registrar' })).not.toBeInTheDocument();
      expect(screen.getByText(/Los registran los docentes/)).toBeInTheDocument();
    });
  });
});
