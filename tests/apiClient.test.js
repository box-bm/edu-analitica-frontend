import { beforeEach, describe, expect, it } from 'vitest';
import apiClient, { setAccessToken } from '../src/services/apiClient';

// Regression tests for the reload bug: the accessToken from login/refresh
// was never attached to outgoing requests, so /api/usuarios/me always 401'd
// after a page reload. These exercise the real apiClient instance with a
// fake axios adapter so no network call is made, but the request
// interceptor chain runs exactly as it does in the app.
function captureAdapter() {
  let capturedConfig;
  const adapter = async (config) => {
    capturedConfig = config;
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
  return { adapter, getConfig: () => capturedConfig };
}

function authorizationHeader(config) {
  const { headers } = config;
  return typeof headers.get === 'function' ? headers.get('Authorization') : headers.Authorization;
}

describe('apiClient Authorization interceptor', () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  it('sends no Authorization header when no accessToken has been set', async () => {
    const { adapter, getConfig } = captureAdapter();

    await apiClient.get('/ping', { adapter });

    expect(authorizationHeader(getConfig())).toBeFalsy();
  });

  it('attaches Authorization: Bearer <token> once setAccessToken is called', async () => {
    setAccessToken('test-access-token');
    const { adapter, getConfig } = captureAdapter();

    await apiClient.get('/ping', { adapter });

    expect(authorizationHeader(getConfig())).toBe('Bearer test-access-token');
  });

  it('stops sending the header after setAccessToken(null) (logout)', async () => {
    setAccessToken('test-access-token');
    setAccessToken(null);
    const { adapter, getConfig } = captureAdapter();

    await apiClient.get('/ping', { adapter });

    expect(authorizationHeader(getConfig())).toBeFalsy();
  });

  it('is configured with withCredentials so the httpOnly refresh cookie is sent cross-domain', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });
});
