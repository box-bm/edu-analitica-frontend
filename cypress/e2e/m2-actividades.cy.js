// Módulo 2 — actividades del docente (máximo 10 preguntas).
// Matriz: M2-06, M2-07 (el límite se valida en la UI y en el backend).
import { desactivar, modulosDeUnGrado, rutaApi, uid } from '../support/datos';

const MAX = 10;

describe('Módulo 2 — actividades del docente', () => {
  const actividades = [];

  after(() => {
    cy.token('docente').then((token) => {
      for (const id of actividades) desactivar(token, `/api/actividades/${id}`);
    });
  });

  it('M2-06: crear una actividad con 10 preguntas', () => {
    const titulo = `E2E Actividad ${uid()}`;
    cy.intercept('POST', rutaApi('/api/actividades')).as('crear');

    cy.visitarComo('docente', '/docente');
    cy.irA('Actividades');
    cy.contains('button', '+ Nueva actividad').click();

    cy.get('[role=dialog]').within(() => {
      cy.contains('label', 'Título').find('input').type(titulo);
      for (let i = 0; i < MAX; i++) {
        if (i > 0) cy.contains('button', '+ Agregar pregunta').click();
        cy.get('.pregunta-editor').eq(i).within(() => {
          cy.contains('label', 'Enunciado').find('input').type(`¿Cuánto es ${i} + 1?`);
          cy.get(`input[aria-label="Pregunta ${i + 1}, opción 1"]`).type(String(i + 1));
          cy.get(`input[aria-label="Pregunta ${i + 1}, opción 2"]`).type(String(i + 2));
          cy.get('input[type=radio]').first().check();
        });
      }
      cy.get('.contador-preguntas').should('have.text', `${MAX}/${MAX}`);
      cy.contains('button', 'Guardar actividad').click();
    });

    cy.wait('@crear').then(({ request, response }) => {
      expect(response.statusCode).to.eq(201);
      expect(request.body.preguntas).to.have.length(MAX);
      request.body.preguntas.forEach((p, i) => expect(p.respuestaCorrecta).to.eq(String(i + 1)));
      actividades.push(response.body.id);
    });
    cy.get('[role=dialog]').should('not.exist');
    cy.contains('[role=status]', `Actividad "${titulo}" creada.`);
    cy.contains('.actividad-card', titulo).should('contain', `${MAX} preguntas`).and('contain', 'Propia');
  });

  it('M2-07: no deja agregar la pregunta 11, ni en la UI ni en el backend', () => {
    cy.visitarComo('docente', '/docente');
    cy.irA('Actividades');
    cy.contains('button', '+ Nueva actividad').click();

    cy.get('[role=dialog]').within(() => {
      for (let i = 1; i < MAX; i++) cy.contains('button', '+ Agregar pregunta').click();
      cy.get('.pregunta-editor').should('have.length', MAX);
      cy.get('.contador-preguntas').should('have.text', `${MAX}/${MAX}`);
      cy.contains('button', '+ Agregar pregunta').should('be.disabled');
    });

    // El backend rechaza 11 preguntas aunque alguien salte la UI.
    cy.token('docente').then((token) => {
      modulosDeUnGrado(token).then(({ matematica }) => {
        const preguntas = Array.from({ length: MAX + 1 }, (_, i) => ({
          enunciado: `Pregunta ${i + 1}`,
          opciones: ['sí', 'no'],
          respuestaCorrecta: 'sí',
        }));
        cy.api(
          token,
          'POST',
          '/api/actividades',
          { idModulo: matematica.id, titulo: `E2E Once ${uid()}`, preguntas },
          { failOnStatusCode: false }
        ).then(({ status, body }) => {
          expect(status).to.eq(400);
          expect(JSON.stringify(body)).to.match(/10 preguntas/);
          if (body?.id) actividades.push(body.id);
        });
      });
    });
  });
});
