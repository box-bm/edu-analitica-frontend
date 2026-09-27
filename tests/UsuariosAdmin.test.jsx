import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsuariosAdmin from '../src/pages/admin/UsuariosAdmin';
import usuariosService from '../src/services/usuariosService';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, nombre: 'Admin Local', rol: 'administrador' } }),
}));

vi.mock('../src/services/usuariosService', () => ({
  default: { listar: vi.fn(), crear: vi.fn(), actualizar: vi.fn() },
}));

const usuarios = [
  { id: 1, nombreCompleto: 'Admin Local', usuario: 'admin.test', activo: true, creadoEn: '2026-09-01T00:00:00Z', rol: { id: 1, nombreRol: 'administrador' } },
  { id: 2, nombreCompleto: 'Ana Docente', usuario: 'ana.docente', activo: true, creadoEn: '2026-09-02T00:00:00Z', rol: { id: 2, nombreRol: 'docente' } },
];

const fila = (texto) => screen.getByText(texto).closest('tr');

describe('UsuariosAdmin (API real)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usuariosService.listar.mockResolvedValue({ success: true, data: usuarios });
  });

  it('lists users from the API', async () => {
    render(<UsuariosAdmin />);
    expect(await screen.findByText('Ana Docente')).toBeInTheDocument();
    expect(usuariosService.listar).toHaveBeenCalled();
  });

  it('does not let the admin deactivate their own account', async () => {
    render(<UsuariosAdmin />);
    await screen.findByText('Ana Docente');
    expect(within(fila('Admin Local')).getByRole('button', { name: 'Desactivar' })).toBeDisabled();
    expect(within(fila('Ana Docente')).getByRole('button', { name: 'Desactivar' })).toBeEnabled();
  });

  it('deactivates another user through the API and reloads', async () => {
    usuariosService.actualizar.mockResolvedValueOnce({ success: true, data: {} });
    render(<UsuariosAdmin />);
    await screen.findByText('Ana Docente');

    await userEvent.click(within(fila('Ana Docente')).getByRole('button', { name: 'Desactivar' }));

    expect(usuariosService.actualizar).toHaveBeenCalledWith(2, { activo: false });
    expect(usuariosService.listar).toHaveBeenCalledTimes(2);
  });

  it('does not send an empty password when editing', async () => {
    usuariosService.actualizar.mockResolvedValueOnce({ success: true, data: {} });
    render(<UsuariosAdmin />);
    await screen.findByText('Ana Docente');

    await userEvent.click(within(fila('Ana Docente')).getByRole('button', { name: 'Editar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(usuariosService.actualizar).toHaveBeenCalledWith(2, {
      nombreCompleto: 'Ana Docente',
      usuario: 'ana.docente',
      rol: 'docente',
    });
  });
});
