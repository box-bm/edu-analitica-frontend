import { AxiosError } from 'axios';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { GrupoProvider, useGrupo } from '../src/context/GrupoContext';
import grupoClient, { setGrupoToken } from '../src/services/grupoClient';
import GrupoRoute from '../src/routes/GrupoRoute';
import AccesoGrupo from '../src/pages/estudiante/AccesoGrupo';

// Simulates the one-time 401 every open group session gets after the deploy
// that changes the group token format.
function EntrarDirecto() {
  const { activo } = useGrupo();
  return activo ? <div>módulos</div> : null;
}

describe('group session invalidated by a 401', () => {
  it('drops the token and sends the kids back to the code screen with a friendly message', async () => {
    render(
      <GrupoProvider>
        <MemoryRouter initialEntries={['/grupo/modulos']}>
          <Routes>
            <Route path="/grupo" element={<AccesoGrupo />} />
            <Route path="/grupo/modulos" element={<GrupoRoute><EntrarDirecto /></GrupoRoute>} />
          </Routes>
        </MemoryRouter>
      </GrupoProvider>
    );
    // No session yet → already on the code screen, without the expiry notice.
    expect(screen.queryByText(/Tu sesión terminó/)).not.toBeInTheDocument();

    setGrupoToken('token-viejo');
    const adapter = async (config) => {
      throw new AxiosError('fail', 'ERR', config, null, { status: 401, data: {}, headers: {}, config });
    };
    await act(async () => {
      await expect(
        grupoClient.post('/api/actividades/1/respuestas', { respuestas: [] }, { adapter })
      ).rejects.toThrow();
    });

    expect(screen.getByText(/Tu sesión terminó\. Escriban otra vez el código del grupo/)).toBeInTheDocument();
    expect(screen.getByLabelText('Código del grupo')).toBeInTheDocument();

    // The stale token is not sent anymore.
    let auth;
    await grupoClient.get('/ping', {
      adapter: async (config) => {
        auth = config.headers.get('Authorization');
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      },
    });
    expect(auth).toBeFalsy();
  });
});
