import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PrivateRoute from '../src/routes/PrivateRoute';

const mockUseAuth = vi.fn();

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRoute(allowedRoles) {
  return render(
    <MemoryRouter initialEntries={['/protegida']}>
      <Routes>
        <Route path="/" element={<div>pantalla de login</div>} />
        <Route path="/no-autorizado" element={<div>no autorizado</div>} />
        <Route
          path="/protegida"
          element={
            <PrivateRoute allowedRoles={allowedRoles}>
              <div>contenido protegido</div>
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('PrivateRoute', () => {
  it('shows a loading state while auth is still resolving', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, hasRole: () => false, loading: true });

    renderWithRoute();

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('redirects to / when the user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, hasRole: () => false, loading: false });

    renderWithRoute();

    expect(screen.getByText('pantalla de login')).toBeInTheDocument();
  });

  it('redirects to /no-autorizado when authenticated but role does not match', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      hasRole: (roles) => roles.includes('Admin'),
      loading: false,
    });

    renderWithRoute(['Docente']);

    expect(screen.getByText('no autorizado')).toBeInTheDocument();
  });

  it('renders the protected content when authenticated and the role matches', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      hasRole: (roles) => roles.includes('Docente'),
      loading: false,
    });

    renderWithRoute(['Docente']);

    expect(screen.getByText('contenido protegido')).toBeInTheDocument();
  });

  it('renders the protected content when authenticated and no role restriction is set', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, hasRole: () => false, loading: false });

    renderWithRoute();

    expect(screen.getByText('contenido protegido')).toBeInTheDocument();
  });
});
