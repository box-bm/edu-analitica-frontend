import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GrupoProvider } from '../src/context/GrupoContext';
import AccesoGrupo from '../src/pages/estudiante/AccesoGrupo';
import grupoService from '../src/services/grupoService';

vi.mock('../src/services/grupoService', () => ({
  default: { login: vi.fn() },
}));

function renderAcceso() {
  return render(
    <GrupoProvider>
      <MemoryRouter initialEntries={['/grupo']}>
        <Routes>
          <Route path="/grupo" element={<AccesoGrupo />} />
          <Route path="/grupo/modulos" element={<div>pantalla de módulos</div>} />
        </Routes>
      </MemoryRouter>
    </GrupoProvider>
  );
}

describe('AccesoGrupo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uppercases, strips symbols and caps the code at 6 characters', async () => {
    renderAcceso();
    const input = screen.getByLabelText('Código del grupo');

    await userEvent.type(input, 'k7-mp 4qzz');

    expect(input).toHaveValue('K7MP4Q');
  });

  it('keeps the button disabled until the code is complete', async () => {
    renderAcceso();
    const boton = screen.getByRole('button', { name: /entrar/i });

    await userEvent.type(screen.getByLabelText('Código del grupo'), 'K7MP4');
    expect(boton).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Código del grupo'), 'Q');
    expect(boton).toBeEnabled();
  });

  it('enters the group area on a valid code', async () => {
    grupoService.login.mockResolvedValueOnce({
      success: true,
      data: { token: 't', grupo: { id: 1, nombreGrupo: 'Los Cohetes', seccion: 'A', grado: '1ro' } },
    });
    renderAcceso();

    await userEvent.type(screen.getByLabelText('Código del grupo'), 'K7MP4Q');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(grupoService.login).toHaveBeenCalledWith('K7MP4Q');
    expect(await screen.findByText('pantalla de módulos')).toBeInTheDocument();
  });

  it('shows a friendly message on a wrong code and stays on the screen', async () => {
    grupoService.login.mockResolvedValueOnce({ success: false, error: 'Ese código no funcionó.' });
    renderAcceso();

    await userEvent.type(screen.getByLabelText('Código del grupo'), 'ZZZZZZ');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/Ese código no funcionó/)).toBeInTheDocument();
    expect(screen.queryByText('pantalla de módulos')).not.toBeInTheDocument();
  });
});
