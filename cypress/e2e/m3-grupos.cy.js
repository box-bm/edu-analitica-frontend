// Módulo 3 — grupos con código de acceso y el flujo de los niños.
// Matriz: M3-01, M3-02, M3-03 (en UI), M3-06, M3-07, M3-09.
// Fuera de Cypress: M3-04 y M3-05 (Supertest), M3-08 (expiración de 45 min, manual)
// y M3-10 (legibilidad en pizarra, manual; aquí solo se revisa el alfabeto).
import {
  crearGrupo,
  crearSeccion,
  desactivar,
  entrarGrupo,
  modulosDeUnGrado,
  respuestasCorrectas,
  rutaApi,
  uid,
} from '../support/datos';

// Sin O/0, I/1 ni L (src/utils/codigoAcceso.ts en el backend).
const CODIGO = /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$/;

describe('Módulo 3 — grupos y actividades de los niños', () => {
  // Datos del spec: una sección nueva, así el avance y los resultados son solo nuestros.
  const ctx = {};

  before(() => {
    cy.token('admin').then((tokenAdmin) => {
      modulosDeUnGrado(tokenAdmin).then((modulos) => {
        Object.assign(ctx, modulos);
        crearSeccion(tokenAdmin, modulos.idGrado).then((seccion) => {
          ctx.seccion = seccion;
        });
      });
    });
    cy.token('docente').then((token) => {
      ctx.grupos = [];
      ctx.tokenDocente = token;
    });
  });

  after(() => {
    cy.token('docente').then((token) => {
      for (const id of ctx.grupos ?? []) desactivar(token, `/api/grupos/${id}`);
    });
    cy.token('admin').then((token) => {
      if (ctx.seccion) desactivar(token, `/api/secciones/${ctx.seccion.id}`);
    });
  });

  const nuevoGrupo = (nombre) =>
    cy.token('docente').then((token) =>
      crearGrupo(token, ctx.seccion.id, nombre).then((grupo) => {
        ctx.grupos.push(grupo.id);
        return grupo;
      })
    );

  it('M3-01: el docente crea un grupo y recibe un código de 6 caracteres', () => {
    const nombre = `E2E Cohetes ${uid()}`;
    cy.intercept('POST', rutaApi('/api/grupos')).as('crear');

    cy.visitarComo('docente', '/docente');
    cy.irA('Grupos');
    cy.contains('button', '+ Nuevo grupo').click();
    cy.get('[role=dialog]').within(() => {
      cy.contains('label', 'Sección').find('select').select(String(ctx.seccion.id));
      cy.contains('label', 'Nombre del grupo').find('input').type(nombre);
      cy.contains('button', 'Crear grupo').click();
    });

    cy.wait('@crear').then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      const { id, codigoAcceso } = response.body;
      ctx.grupos.push(id);
      expect(codigoAcceso).to.match(CODIGO);

      cy.contains('[role=status]', `Su código es ${codigoAcceso}`);
      cy.contains('.grupo-card', nombre)
        .find('.codigo-grande')
        .should('have.text', codigoAcceso);
    });
  });

  it('M3-03: un código que no existe muestra un mensaje amable y no deja entrar', () => {
    cy.intercept('POST', rutaApi('/api/auth/grupo-login')).as('entrar');
    cy.visit('/grupo');
    cy.get('#codigo-grupo').type('ZZZZ99');
    cy.contains('button', '¡Entrar!').click();

    cy.wait('@entrar').its('response.statusCode').should('eq', 401);
    cy.get('.acceso-aviso').should('be.visible').invoke('text').should('not.match', /inv[aá]lido|error|reprob/i);
    cy.location('pathname').should('match', /\/grupo$/);
  });

  it('M3-02 / M3-06 / M3-09: el grupo entra, resuelve una actividad y su avance se actualiza', () => {
    nuevoGrupo(`E2E Estrellas ${uid()}`).then((grupo) => {
      cy.intercept('POST', rutaApi('/api/auth/grupo-login')).as('entrar');
      cy.intercept('POST', rutaApi('/api/actividades/*/respuestas')).as('respuestas');

      // M3-02: entra con el código (en minúsculas y con guion: se normaliza).
      cy.visit('/grupo');
      cy.get('#codigo-grupo').type(`${grupo.codigoAcceso.slice(0, 3).toLowerCase()}-${grupo.codigoAcceso.slice(3)}`);
      cy.contains('button', '¡Entrar!').click();
      cy.wait('@entrar').then(({ request, response }) => {
        expect(request.body.codigo_acceso).to.eq(grupo.codigoAcceso);
        expect(response.statusCode).to.eq(200);
        expect(response.body.token).to.be.a('string');
      });
      cy.location('pathname').should('match', /\/grupo\/modulos$/);
      cy.contains('.grupo-topbar', grupo.nombreGrupo);
      cy.get('.grupo-avance-numero').should('contain', '0');

      // M3-06: elige el módulo (Matemática en el seed) y responde todo bien.
      cy.contains('.modulo-card', ctx.matematica.nombreModulo).click();
      cy.contains('.actividad-tile', '¡Jugar!').first().click();
      cy.location('pathname')
        .should('match', /\/grupo\/actividad\/\d+$/)
        .then((ruta) => {
          const idActividad = Number(ruta.split('/').pop());
          respuestasCorrectas(ctx.tokenDocente, idActividad).then(({ actividad, porEnunciado }) => {
            const total = actividad.preguntas.length;
            for (let i = 0; i < total; i++) {
              cy.get('.pregunta-enunciado')
                .invoke('text')
                .then((enunciado) => {
                  cy.opcion(porEnunciado.get(enunciado.trim()).respuestaCorrecta).click();
                });
              cy.contains('button', i === total - 1 ? '¡Terminamos!' : 'Siguiente').click();
            }

            cy.wait('@respuestas').then(({ response }) => {
              expect(response.statusCode).to.eq(201);
              expect(response.body.puntaje).to.eq(total);
            });
            cy.location('pathname').should('match', /\/grupo\/resultado$/);
            cy.get('.resultado-puntaje').should('contain', `Acertaron ${total} de ${total}`);
            cy.get('.resultado-card [role=img]').should('have.attr', 'aria-label', '3 de 3 estrellas');

            // El resultado queda a nombre de ESTE grupo.
            cy.api(ctx.tokenDocente, 'GET', `/api/docentes/me/resultados?id_grupo=${grupo.id}`).then(({ body }) => {
              expect(body.some((r) => r.actividad.id === idActividad && r.puntaje === total)).to.eq(true);
              body.forEach((r) => expect(r.grupo.id).to.eq(grupo.id));
            });

            // M3-09: el avance refleja la actividad hecha, para el grupo y para el docente.
            cy.contains('a', 'Más actividades').click();
            cy.contains('.actividad-tile.hecha', actividad.titulo);
            cy.contains('a', '← Módulos').click();
            cy.get('.grupo-avance-numero').should('contain', '1');

            cy.visitarComo('docente', '/docente');
            cy.irA('Grupos');
            cy.contains('.grupo-card', grupo.nombreGrupo)
              .find('.avances li')
              .contains('li', ctx.matematica.nombreModulo)
              .find('b')
              .invoke('text')
              .then((texto) => expect(parseInt(texto, 10)).to.be.greaterThan(0));
          });
        });
    });
  });

  it('M3-07: al regenerar el código, el anterior deja de funcionar', () => {
    nuevoGrupo(`E2E Cambio ${uid()}`).then((grupo) => {
      cy.intercept('PUT', rutaApi(`/api/grupos/${grupo.id}/regenerar-codigo`)).as('regenerar');

      cy.visitarComo('docente', '/docente');
      cy.irA('Grupos');
      cy.contains('.grupo-card', grupo.nombreGrupo).contains('button', 'Nuevo código').click();
      cy.get('[role=dialog]').contains('button', 'Generar código').click();

      cy.wait('@regenerar').then(({ response }) => {
        const nuevo = response.body.codigoAcceso;
        expect(nuevo).to.match(CODIGO).and.not.eq(grupo.codigoAcceso);
        cy.contains('[role=status]', nuevo);
        cy.contains('.grupo-card', grupo.nombreGrupo).find('.codigo-grande').should('have.text', nuevo);

        cy.api(null, 'POST', '/api/auth/grupo-login', { codigo_acceso: grupo.codigoAcceso }, { failOnStatusCode: false })
          .its('status')
          .should('eq', 401);
        entrarGrupo(nuevo).should('be.a', 'string');
      });
    });
  });
});
