import { describe, expect, it } from 'vitest';
import { permisosReportes } from '../src/utils/permisos';

describe('permisosReportes', () => {
  it('lets the docente read and register, only within their own secciones', () => {
    expect(permisosReportes('docente')).toEqual({ ver: true, registrar: true, secciones: 'propias' });
  });

  it('lets the admin read every sección but not register', () => {
    expect(permisosReportes('administrador')).toEqual({ ver: true, registrar: false, secciones: 'todas' });
  });

  it('gives nothing to a role that was not enabled explicitly', () => {
    expect(permisosReportes('estudiante')).toMatchObject({ ver: false, registrar: false });
    expect(permisosReportes(undefined)).toMatchObject({ ver: false, registrar: false });
  });
});
