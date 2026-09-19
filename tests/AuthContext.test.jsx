import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import apiClient, { setAccessToken } from '../src/services/apiClient';
import userService from '../src/services/userService';

vi.mock('../src/services/userService', () => ({
  default: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

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

async function currentAuthorizationHeader() {
  const { adapter, getConfig } = captureAdapter();
  await apiClient.get('/ping', { adapter });
  return authorizationHeader(getConfig());
}

function Harness() {
  const { user, loading, isAuthenticated, error, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="user">{user ? `${user.nombre}:${user.rol}` : 'none'}</div>
      <div data-testid="error">{error ?? 'none'}</div>
      <button onClick={() => login({ usuario: 'admin.test', contraseña: 'secreta' })}>
        login
      </button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function renderHarness() {
  return render(
    <AuthProvider>
      <Harness />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAccessToken(null);
  });

  it('restores the session on mount when refresh + me both succeed, and attaches the accessToken to later requests', async () => {
    userService.refresh.mockResolvedValueOnce({
      success: true,
      data: { accessToken: 'refreshed-token' },
    });
    userService.me.mockResolvedValueOnce({
      success: true,
      data: {
        id: 1,
        nombreCompleto: 'Admin Principal',
        usuario: 'admin.test',
        rol: { id: 1, nombreRol: 'administrador' },
      },
    });

    renderHarness();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent('Admin Principal:administrador');

    // This is the exact regression the reload bug was: confirm the token
    // obtained from refresh() is actually attached to subsequent requests.
    await expect(currentAuthorizationHeader()).resolves.toBe('Bearer refreshed-token');
  });

  it('leaves the user unauthenticated when refresh fails (no valid session)', async () => {
    userService.refresh.mockResolvedValueOnce({ success: false, error: 'Sesion expirada' });

    renderHarness();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(userService.me).not.toHaveBeenCalled();
    await expect(currentAuthorizationHeader()).resolves.toBeFalsy();
  });

  it('login() authenticates the user and makes subsequent requests carry the new accessToken', async () => {
    userService.refresh.mockResolvedValueOnce({ success: false, error: 'Sin sesion' });
    userService.login.mockResolvedValueOnce({
      success: true,
      data: {
        accessToken: 'login-token',
        usuario: { id: 2, nombre: 'Docente Uno', rol: 'docente' },
      },
    });

    const user = userEvent.setup();
    renderHarness();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await act(async () => {
      await user.click(screen.getByText('login'));
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent('Docente Uno:docente');
    await expect(currentAuthorizationHeader()).resolves.toBe('Bearer login-token');
  });

  it('logout() clears the user and stops attaching the accessToken to requests', async () => {
    userService.refresh.mockResolvedValueOnce({ success: false, error: 'Sin sesion' });
    userService.login.mockResolvedValueOnce({
      success: true,
      data: {
        accessToken: 'login-token',
        usuario: { id: 2, nombre: 'Docente Uno', rol: 'docente' },
      },
    });
    userService.logout.mockResolvedValueOnce({ success: true });

    const user = userEvent.setup();
    renderHarness();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    await act(async () => {
      await user.click(screen.getByText('login'));
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

    await act(async () => {
      await user.click(screen.getByText('logout'));
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    await expect(currentAuthorizationHeader()).resolves.toBeFalsy();
  });

  it('login() surfaces the backend error message on invalid credentials without authenticating', async () => {
    userService.refresh.mockResolvedValueOnce({ success: false, error: 'Sin sesion' });
    userService.login.mockResolvedValueOnce({ success: false, error: 'Credenciales invalidas' });

    const user = userEvent.setup();
    renderHarness();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    await act(async () => {
      await user.click(screen.getByText('login'));
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('Credenciales invalidas');
  });
});
