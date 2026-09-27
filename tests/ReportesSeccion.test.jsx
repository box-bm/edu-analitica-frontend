import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReportesSeccion from '../src/pages/docente/reportes/ReportesSeccion';
import actividadesService from '../src/services/actividadesService';
import gruposService from '../src/services/gruposService';
import reportesService from '../src/services/reportesService';

vi.mock('../src/services/gruposService', () => ({ default: { listarMisGrupos: vi.fn() } }));
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

const vistaConDatos = {
  totales: { grupos: 2, actividades: 4, intentos: 6, porcentajePromedio: 75 },
  grupos: [
    { idGrupo: 1, nombreGrupo: 'Leones', actividadesCompletadas: 3, intentos: 4, porcentajePromedio: 90 },
    { idGrupo: 2, nombreGrupo: 'Tigres', actividadesCompletadas: 1, intentos: 2, porcentajePromedio: 60 },
  ],
  mejorGrupo: { idGrupo: 1, nombreGrupo: 'Leones', porcentajePromedio: 90 },
  peorGrupo: { idGrupo: 2, nombreGrupo: 'Tigres', porcentajePromedio: 60 },
};

const vistaVacia = { totales: { grupos: 2, actividades: 4, intentos: 0, porcentajePromedio: 0 }, grupos: [], mejorGrupo: null, peorGrupo: null };

const reporte = {
  id: 7,
  idSeccion: 10,
  idModulo: 100,
  urlPdf: 'https://drive.google.com/file/d/abc/view',
  generadoEn: '2026-09-20T15:00:00Z',
  seccion: primeroA,
  modulo: { id: 100, nombreModulo: 'Sumas' },
};

const campoLink = () => screen.getByLabelText('Link del PDF');

describe('ReportesSeccion (Módulo 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
