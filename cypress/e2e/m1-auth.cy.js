// Módulo 1 — autenticación y usuarios.
// Matriz: M1-01, M1-02, M1-04, M1-06, M1-10, M1-11, M1-13.
// Fuera de Cypress: M1-03, M1-05, M1-07, M1-08, M1-09 (Supertest) y M1-12 (manual, DevTools).
//
// Este spec usa 3 de los 5 logins por IP cada 15 min (el 4.º y 5.º son las
// sesiones cacheadas de admin y docente). Ver cypress/support/commands.js.
import { rutaApi, uid } from '../support/datos';

describe('Módulo 1 — autenticación', () => {
  it('M1-01 / M1-04 / M1-06: login real, la sesión sobrevive al reload y el logout la revoca', () => {
    cy.intercept('POST', rutaApi('/api/auth/login')).as('login');
    cy.intercept('POST', rutaApi('/api/auth/logout')).as('logout');

    cy.credenciales('docente').then(({ usuario, password }) => {
      cy.visit('/');
      cy.get('#login-usuario').type(usuario);
      cy.get('#login-password').type(password, { log: false });
      cy.contains('button', 'Ingresar').click();
    });

    // M1-01: accessToken en el body, cookie httpOnly de refresh y aterrizaje por rol.
    cy.wait('@login').then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expect(response.body.accessToken).to.be.a('string').and.not.be.empty;
      expect(response.body.usuario.rol).to.eq('docente');
    });
    cy.location('pathname').should('match', /\/docente$/);
    cy.getCookie('refreshToken', { domain: new URL(Cypress.expose('apiUrl')).hostname })
      .should('exist')
      .and('have.property', 'httpOnly', true)
      .then((cookie) => cy.wrap(cookie.value).as('cookieRefresh'));

    // M1-04: al recargar, el refresh recupera la sesión sin volver al login.
    // (El alias va aquí: al abrir "/" sin sesión ya hubo un refresh con 401.)
    cy.intercept('POST', rutaApi('/api/auth/refresh')).as('refresh');
    cy.reload();
    cy.wait('@refresh').its('response.statusCode').should('eq', 200);
    cy.location('pathname').should('match', /\/docente$/);
    cy.get('.dashboard-role').should('have.text', 'Docente');

    // M1-06: el logout revoca la sesión en el servidor, no solo borra la cookie.
    cy.contains('button', 'Cerrar sesión').click();
    cy.wait('@logout').its('response.statusCode').should('be.oneOf', [200, 204]);
    cy.get('#login-usuario').should('be.visible');

    cy.get('@cookieRefresh').then((valor) => {
      cy.request({
        method: 'POST',
        url: rutaApi('/api/auth/refresh'),
        headers: { Cookie: `refreshToken=${valor}` },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 401);
    });
  });

  it('M1-02: password incorrecta da 401 con un mensaje genérico', () => {
    cy.intercept('POST', rutaApi('/api/auth/login')).as('login');

    cy.credenciales('docente').then(({ usuario }) => {
      cy.visit('/');
      cy.get('#login-usuario').type(usuario);
      cy.get('#login-password').type(`incorrecta-${uid()}`);
      cy.contains('button', 'Ingresar').click();
    });

    cy.wait('@login').its('response.statusCode').should('eq', 401);
    cy.get('.login-error')
      .should('be.visible')
      .invoke('text')
      .then((texto) => {
        // No debe decir si el usuario existe o cuál campo estuvo mal.
        expect(texto.toLowerCase()).not.to.match(/no existe|contraseña incorrecta|password incorrect/);
      });
    cy.location('pathname').should('not.match', /\/docente$/);
  });

  it('M1-13: cada rol aterriza en su panel y ve "Cerrar sesión"', () => {
    const casos = [
      { rol: 'admin', ruta: /\/admin$/, etiqueta: 'Administración' },
      { rol: 'docente', ruta: /\/docente$/, etiqueta: 'Docente' },
    ];
    for (const { rol, ruta, etiqueta } of casos) {
      cy.loginAs(rol);
      cy.visit('/');
      cy.location('pathname').should('match', ruta);
      cy.get('.dashboard-role').should('have.text', etiqueta);
      cy.contains('button', 'Cerrar sesión').should('be.visible');
    }
  });
});

describe('Módulo 1 — usuarios (admin)', () => {
  const creados = [];

  after(() => {
    cy.token('admin').then((token) => {
      for (const id of creados) {
        cy.api(token, 'DELETE', `/api/usuarios/${id}`, undefined, { failOnStatusCode: false, log: false });
      }
    });
  });

  it('M1-10: crear un usuario docente desde el panel', () => {
    const usuario = `e2e.doc.${uid(6).toLowerCase()}`;
    cy.intercept('POST', rutaApi('/api/usuarios')).as('crear');

    cy.visitarComo('admin', '/admin');
    cy.irA('Usuarios');
    cy.contains('button', '+ Nuevo usuario').click();

    cy.get('[role=dialog]').within(() => {
      cy.contains('label', 'Nombre completo').find('input').type('E2E Docente Prueba');
      cy.contains('label', 'Usuario').find('input').type(usuario);
      cy.contains('label', 'Contraseña').find('input').type('ClaveE2E-12345');
      cy.contains('label', 'Rol').find('select').should('have.value', 'docente');
      cy.contains('button', 'Guardar').click();
    });

    cy.wait('@crear').then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      // La API nunca debe devolver la contraseña ni su hash (bcrypt en DB: TX-08, manual).
      expect(JSON.stringify(response.body)).not.to.match(/ClaveE2E-12345|password/i);
      creados.push(response.body.id);
    });
    cy.get('[role=dialog]').should('not.exist');
    cy.contains('[role=status]', `Usuario "${usuario}" creado.`);
    cy.contains('tr', usuario).within(() => {
      cy.contains('Docente');
      cy.contains('Activo');
    });
  });

  it('M1-11: un usuario desactivado ya no puede iniciar sesión', () => {
    const usuario = `e2e.off.${uid(6).toLowerCase()}`;
    const password = 'ClaveE2E-12345';

    cy.token('admin').then((token) => {
      cy.api(token, 'POST', '/api/usuarios', {
        nombreCompleto: 'E2E Usuario Desactivado',
        usuario,
        password,
        rol: 'docente',
      }).then(({ body }) => creados.push(body.id));
    });

    cy.visitarComo('admin', '/admin');
    cy.irA('Usuarios');
    cy.contains('tr', usuario).within(() => {
      cy.contains('button', 'Desactivar').click();
      cy.contains('Inactivo');
    });
    cy.contains('[role=status]', 'ya no puede iniciar sesión');

    cy.loginApi(usuario, password).its('status').should('be.oneOf', [401, 403]);
  });
});
