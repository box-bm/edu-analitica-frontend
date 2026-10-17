import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BitacoraAdmin from '../src/pages/admin/BitacoraAdmin';
import auditoriaService from '../src/services/auditoriaService';
import usuariosService from '../src/services/usuariosService';

vi.mock('../src/services/auditoriaService', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { listar: vi.fn() },
}));
vi.mock('../src/services/usuariosService', () => ({ default: { listar: vi.fn() } }));

const pagina = (registros, total = registros.length) => ({
  success: true,
  data: { total, pagina: 1, limite: 50, registros },
});

describe('BitacoraAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usuariosService.listar.mockResolvedValue({ success: true, data: [{ id: 1, nombreCompleto: 'Admin Local' }] });
  });

  it('shows readable actions, resolves user names, and highlights incidents', async () => {
    auditoriaService.listar.mockResolvedValue(
      pagina([
        { id: 2, fecha: '2026-10-17T15:00:00Z', accion: 'refresh_reutilizado', idUsuario: 7, idGrupo: null, ip: '1.2.3.4', detalle: null },
        { id: 1, fecha: '2026-10-17T14:00:00Z', accion: 'login_exitoso', idUsuario: 1, idGrupo: null, ip: '1.2.3.4', detalle: { usuario: 'admin' } },
      ])
    );
    render(<BitacoraAdmin />);

    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByText('Reuso de sesión (posible robo)').closest('tr')).toHaveClass('fila-incidente');
    expect(within(tabla).getByText('Inicio de sesión').closest('tr')).not.toHaveClass('fila-incidente');
    expect(await screen.findByText('Admin Local')).toBeInTheDocument();
    expect(screen.getByText('#7')).toBeInTheDocument(); // unknown user → id
  });

  it('sends the action filter and resets to page 1', async () => {
    auditoriaService.listar.mockResolvedValue(pagina([], 0));
    render(<BitacoraAdmin />);
    await screen.findByText('No hay registros con estos filtros.');

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por acción'), 'login_fallido');

    expect(auditoriaService.listar).toHaveBeenLastCalledWith(
      expect.objectContaining({ accion: 'login_fallido', pagina: 1 })
    );
  });

  it('shows the backend message on invalid filters', async () => {
    auditoriaService.listar.mockResolvedValue({ success: false, error: 'Filtros invalidos' });
    render(<BitacoraAdmin />);
    expect(await screen.findByText('Filtros invalidos')).toBeInTheDocument();
  });
});
