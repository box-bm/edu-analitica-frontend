// Comandos compartidos por los specs E2E.
//
// Límite de login del backend: POST /api/auth/login acepta 5 intentos cada
// 15 minutos por IP, contando también los exitosos. Por eso el login de
// admin y docente se reutiliza: cy.session lo cachea durante la corrida y la
// cookie de refresh (válida 7 días, no rota) se guarda en
// cypress/.sesiones.json para las corridas siguientes. Los tests preparan
// datos por API con el accessToken que da /api/auth/refresh, que no cuenta
// para ese límite.

const api = (ruta) => `${Cypress.expose('apiUrl')}${ruta}`;
const apiUrl = () => new URL(Cypress.expose('apiUrl'));

const MENSAJE_LIMITE =
  'El backend devolvió 429 en /api/auth/login (5 intentos cada 15 min por IP). ' +
  'Espera 15 minutos antes de volver a correr los tests de login.';

Cypress.Commands.add('credenciales', (rol) => {
  const clave = rol.toUpperCase();
  return cy.env([`${clave}_USER`, `${clave}_PASSWORD`], { log: false }).then((env) => {
    const usuario = env[`${clave}_USER`];
    const password = env[`${clave}_PASSWORD`];
    if (!usuario || !password) {
      throw new Error(
        `Faltan ${clave}_USER / ${clave}_PASSWORD. Cópialos de cypress.env.example.json a cypress.env.json ` +
          `o defínelos como CYPRESS_${clave}_USER y CYPRESS_${clave}_PASSWORD.`
      );
    }
    return { usuario, password };
  });
});

// POST /api/auth/login sin fallar por status, para probar credenciales malas.
Cypress.Commands.add('loginApi', (usuario, password) =>
  cy
    .request({ method: 'POST', url: api('/api/auth/login'), body: { usuario, password }, failOnStatusCode: false })
    .then((res) => {
      if (res.status === 429) throw new Error(MENSAJE_LIMITE);
      return res;
    })
);

// Sesión real (cookie httpOnly del refresh) cacheada para toda la corrida y
// entre corridas. Solo hace login si la cookie guardada ya no sirve.
Cypress.Commands.add('loginAs', (rol) => {
  const refrescar = () =>
    cy.request({ method: 'POST', url: api('/api/auth/refresh'), failOnStatusCode: false, log: false });

  cy.credenciales(rol).then(({ usuario, password }) => {
    const clave = `${rol}:${usuario}@${apiUrl().host}`;
    cy.session(
      ['e2e', rol, usuario],
      () => {
        cy.task('leerSesion', clave, { log: false }).then((valor) => {
          if (valor) {
            const https = apiUrl().protocol === 'https:';
            cy.setCookie('refreshToken', valor, {
              domain: apiUrl().hostname,
              path: '/api/auth',
              httpOnly: true,
              secure: https,
              sameSite: https ? 'no_restriction' : 'strict',
              log: false,
            });
          }
          refrescar().then((res) => {
            if (res.status === 200) return;
            cy.loginApi(usuario, password).its('status').should('eq', 200);
            cy.getCookie('refreshToken', { domain: apiUrl().hostname, log: false }).then((cookie) =>
              cy.task('guardarSesion', { clave, valor: cookie.value }, { log: false })
            );
          });
        });
      },
      {
        cacheAcrossSpecs: true,
        validate() {
          refrescar().its('status').should('eq', 200);
        },
      }
    );
  });
});

// accessToken del rol, para preparar datos por API.
Cypress.Commands.add('token', (rol) => {
  cy.loginAs(rol);
  return cy
    .request({ method: 'POST', url: api('/api/auth/refresh'), log: false })
    .its('body.accessToken', { log: false });
});

// Llamada autenticada a la API (token de docente/admin o de grupo).
Cypress.Commands.add('api', (token, method, ruta, body, opciones = {}) =>
  cy.request({
    method,
    url: api(ruta),
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    ...opciones,
  })
);

Cypress.Commands.add('visitarComo', (rol, ruta = '/') => {
  cy.loginAs(rol);
  cy.visit(ruta);
  cy.get('.dashboard-layout').should('be.visible');
});

Cypress.Commands.add('irA', (pestana) => {
  cy.contains('.sidebar-item', pestana).click();
  cy.get('.dashboard-title').should('contain', pestana);
});

// Valor mostrado en una StatCard, por su etiqueta.
Cypress.Commands.add('statCard', (etiqueta) =>
  cy.contains('.stat-card-label', new RegExp(`^${etiqueta}$`)).siblings('.stat-card-value')
);

// Opción de respuesta del niño con texto exacto (evita que "1" coincida con "10").
Cypress.Commands.add('opcion', (texto) =>
  cy.get('button.opcion').filter((_, el) => el.querySelector('.opcion-texto').textContent.trim() === texto)
);
