import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient, { onSesionExpirada, refrescarSesion, setAccessToken } from '../src/services/apiClient';

// Fake backend behind the real apiClient (interceptors included): protected
// routes 401 unless they carry the token that refresh hands out, and refresh
// resolves after a tick so concurrent 401s really overlap.
function fakeBackend({ refreshStatus = 200 } = {}) {
  const llamadas = { refresh: 0, protegidas: [] };
  const adapter = async (config) => {
    const auth = config.headers.get?.('Authorization') ?? config.headers.Authorization;
    if (config.url === '/api/auth/refresh') {
      llamadas.refresh += 1;
      await new Promise((r) => setTimeout(r, 10));
      if (refreshStatus !== 200) {
        throw new AxiosError('fail', 'ERR', config, null, {
          status: refreshStatus, data: { message: 'Sesion invalida' }, headers: {}, config,
        });
      }
      return { data: { accessToken: 'nuevo' }, status: 200, statusText: 'OK', headers: {}, config };
    }
    llamadas.protegidas.push({ url: config.url, auth });
    if (auth !== 'Bearer nuevo') {
      throw new AxiosError('fail', 'ERR', config, null, { status: 401, data: {}, headers: {}, config });
    }
    return { data: { url: config.url }, status: 200, statusText: 'OK', headers: {}, config };
  };
  return { adapter, llamadas };
}

describe('apiClient refresh single-flight', () => {
  const adapterOriginal = apiClient.defaults.adapter;

  beforeEach(() => {
    setAccessToken('vencido');
  });

  afterEach(() => {
    apiClient.defaults.adapter = adapterOriginal;
    setAccessToken(null);
    onSesionExpirada(null);
  });

  it('3 concurrent 401s trigger a single refresh and all retry with the new token', async () => {
    const { adapter, llamadas } = fakeBackend();
    apiClient.defaults.adapter = adapter;

    const respuestas = await Promise.all([
      apiClient.get('/api/a'),
      apiClient.get('/api/b'),
      apiClient.get('/api/c'),
    ]);

    expect(llamadas.refresh).toBe(1);
    expect(respuestas.map((r) => r.data.url)).toEqual(['/api/a', '/api/b', '/api/c']);
    expect(llamadas.protegidas.filter((l) => l.auth === 'Bearer nuevo')).toHaveLength(3);
  });

  it('the reload refresh shares the in-flight promise instead of firing a second one', async () => {
    const { adapter, llamadas } = fakeBackend();
    apiClient.defaults.adapter = adapter;

    const [token] = await Promise.all([refrescarSesion(), apiClient.get('/api/a')]);

    expect(token).toBe('nuevo');
    expect(llamadas.refresh).toBe(1);
  });

  it('clears the shared promise afterwards, so a later expiry refreshes again', async () => {
    const { adapter, llamadas } = fakeBackend();
    apiClient.defaults.adapter = adapter;

    await refrescarSesion();
    await refrescarSesion();

    expect(llamadas.refresh).toBe(2);
  });

  it('a 401 on refresh expires the session once, without retrying or looping', async () => {
    const { adapter, llamadas } = fakeBackend({ refreshStatus: 401 });
    apiClient.defaults.adapter = adapter;
    const expirada = vi.fn();
    onSesionExpirada(expirada);

    const resultados = await Promise.allSettled([apiClient.get('/api/a'), apiClient.get('/api/b')]);

    expect(resultados.every((r) => r.status === 'rejected')).toBe(true);
    expect(llamadas.refresh).toBe(1);
    expect(llamadas.protegidas).toHaveLength(2); // no retries
    expect(expirada).toHaveBeenCalled();
    // The stale token is gone: nothing keeps sending it.
    apiClient.defaults.adapter = async (config) => ({
      data: config.headers.get('Authorization') ?? null, status: 200, statusText: 'OK', headers: {}, config,
    });
    await expect(apiClient.get('/api/x').then((r) => r.data)).resolves.toBeNull();
  });

  it('a network error on refresh fails the request but keeps the session', async () => {
    const { adapter } = fakeBackend({ refreshStatus: 502 });
    apiClient.defaults.adapter = adapter;
    const expirada = vi.fn();
    onSesionExpirada(expirada);

    await expect(apiClient.get('/api/a')).rejects.toThrow();
    expect(expirada).not.toHaveBeenCalled();
  });

  it('never refreshes on a 401 from /api/auth/* (wrong credentials on login)', async () => {
    const { adapter, llamadas } = fakeBackend();
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/api/auth/login') {
        throw new AxiosError('fail', 'ERR', config, null, { status: 401, data: {}, headers: {}, config });
      }
      return adapter(config);
    };

    await expect(apiClient.post('/api/auth/login', {})).rejects.toThrow();
    expect(llamadas.refresh).toBe(0);
  });
});
