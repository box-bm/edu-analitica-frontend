import { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import apiClient, { setAccessToken } from '../src/services/apiClient';
import grupoClient, { onGrupoSesionExpirada, setGrupoToken } from '../src/services/grupoClient';

function captureAdapter() {
  let capturedConfig;
  const adapter = async (config) => {
    capturedConfig = config;
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
  return { adapter, getConfig: () => capturedConfig };
}

const failingAdapter = (status) => async (config) => {
  throw new AxiosError('fail', 'ERR', config, null, { status, data: {}, headers: {}, config });
};

const header = (config) =>
  typeof config.headers.get === 'function' ? config.headers.get('Authorization') : config.headers.Authorization;

describe('grupoClient (Módulo 3 group session)', () => {
  afterEach(() => {
    setGrupoToken(null);
    setAccessToken(null);
    onGrupoSesionExpirada(null);
  });

  it('attaches the group token, independent of the docente/admin accessToken', async () => {
    setAccessToken('token-docente');
    setGrupoToken('token-grupo');

    const grupo = captureAdapter();
    const docente = captureAdapter();
    await grupoClient.get('/ping', { adapter: grupo.adapter });
    await apiClient.get('/ping', { adapter: docente.adapter });

    expect(header(grupo.getConfig())).toBe('Bearer token-grupo');
    expect(header(docente.getConfig())).toBe('Bearer token-docente');
  });

  it('does not send cookies (no refresh flow for groups)', () => {
    expect(grupoClient.defaults.withCredentials).toBeFalsy();
  });

  it('notifies expiry on a 401 from a group route', async () => {
    const expirada = vi.fn();
    onGrupoSesionExpirada(expirada);

    await expect(grupoClient.get('/api/grupo/me/avance', { adapter: failingAdapter(401) })).rejects.toThrow();
    expect(expirada).toHaveBeenCalledTimes(1);
  });

  it('does not treat a wrong code on grupo-login as an expired session', async () => {
    const expirada = vi.fn();
    onGrupoSesionExpirada(expirada);

    await expect(
      grupoClient.post('/api/auth/grupo-login', {}, { adapter: failingAdapter(401) })
    ).rejects.toThrow();
    expect(expirada).not.toHaveBeenCalled();
  });
});
