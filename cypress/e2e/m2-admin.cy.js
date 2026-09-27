// Módulo 2 — panel de administración, secciones, filtros y menú por rol.
// Matriz: M2-01, M2-04, M2-05, M2-08, M2-09.
// Sin pantalla en el frontend (quedan para Supertest): M2-02 (CRUD de módulos) y M2-03 (grados).
import { crearSeccion, desactivar, modulosDeUnGrado, rutaApi, uid } from '../support/datos';

describe('Módulo 2 — admin', () => {
  const secciones = [];

  after(() => {
    cy.token('admin').then((token) => {
      for (const id of secciones) desactivar(token, `/api/secciones/${id}`);
    });
  });

  it('M2-01: las tarjetas del inicio muestran los totales del backend', () => {
    cy.intercept('GET', rutaApi('/api/reportes/resumen*')).as('resumen');
    cy.visitarComo('admin', '/admin');

    cy.wait('@resumen').then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      const { totales } = response.body;
      cy.statCard('Docentes activos').should('have.text', String(totales.docentes));
      cy.statCard('Secciones').should('have.text', String(totales.secciones));
      cy.statCard('Grupos activos').should('have.text', String(totales.grupos));
      cy.statCard('Actividades terminadas').should('have.text', String(totales.intentos));
    });
  });

  it('M2-05: crear una sección válida', () => {
    const nombre = `E${uid(4)}`;
    cy.intercept('POST', rutaApi('/api/secciones')).as('crear');

    cy.visitarComo('admin', '/admin');
    cy.irA('Secciones');
    cy.contains('button', '+ Nueva sección').click();
    cy.get('[role=dialog]').within(() => {
      cy.contains('label', 'Nombre de la sección').find('input').type(nombre);
      cy.contains('button', 'Guardar').click();
    });

    cy.wait('@crear').then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      secciones.push(response.body.id);
    });
    cy.get('[role=dialog]').should('not.exist');
    cy.contains('tr', nombre).should('contain', 'Activo');
  });

  it('M2-04: no permite una sección duplicada en el mismo grado', () => {
    cy.token('admin').then((token) => {
      modulosDeUnGrado(token).then(({ idGrado }) => {
        crearSeccion(token, idGrado).then((seccion) => {
          secciones.push(seccion.id);

          cy.intercept('POST', rutaApi('/api/secciones')).as('crear');
          cy.visitarComo('admin', '/admin');
          cy.irA('Secciones');
          cy.contains('button', '+ Nueva sección').click();
          cy.get('[role=dialog]').within(() => {
            cy.contains('label', 'Grado').find('select').select(String(idGrado));
            cy.contains('label', 'Nombre de la sección').find('input').type(seccion.nombreSeccion);
            cy.contains('button', 'Guardar').click();
          });

          cy.wait('@crear').its('response.statusCode').should('eq', 409);
          cy.get('[role=dialog]').within(() => {
            cy.get('.form-error').should('contain', 'Ya existe');
          });
          cy.get('.data-table tbody tr').filter(`:contains("${seccion.nombreSeccion}")`).should('have.length', 1);
        });
      });
    });
  });
});

describe('Módulo 2 — menú y filtros por rol', () => {
  it('M2-09: cada rol ve solo sus opciones del menú', () => {
    const menus = {
      admin: { ve: ['Inicio', 'Usuarios', 'Secciones', 'Reportes'], noVe: ['Grupos', 'Actividades'] },
      docente: { ve: ['Inicio', 'Grupos', 'Actividades', 'Reportes'], noVe: ['Usuarios', 'Secciones'] },
    };
    for (const [rol, { ve, noVe }] of Object.entries(menus)) {
      cy.visitarComo(rol);
      cy.get('.sidebar-item .sidebar-label').then(($items) => {
        expect([...$items].map((el) => el.textContent.trim())).to.deep.eq(ve);
      });
      for (const label of noVe) cy.contains('.sidebar-item', label).should('not.exist');
    }

    // Entrar por URL a la ruta del otro rol lleva a "no autorizado".
    cy.visitarComo('docente', '/docente');
    cy.visit('/admin');
    cy.location('pathname').should('match', /\/no-autorizado$/);
  });

  it('M2-08: el reporte por actividad se filtra por grado', () => {
    cy.intercept('GET', rutaApi('/api/reportes/actividades*')).as('actividades');
    cy.visitarComo('docente', '/docente');
    cy.irA('Reportes');
    cy.contains('.selector-vista button', 'Aciertos por actividad').click();
    cy.wait('@actividades');

    cy.get('select[aria-label="Filtrar por grado"] option:not([value=""])')
      .first()
      .then(($opcion) => {
        const idGrado = $opcion.val();
        const nombreGrado = $opcion.text().trim();
        cy.get('select[aria-label="Filtrar por grado"]').select(idGrado);

        cy.wait('@actividades').then(({ request, response }) => {
          expect(new URL(request.url).searchParams.get('id_grado')).to.eq(idGrado);
          const filas = response.body.actividades;
          filas.forEach((a) => expect(a.grado).to.eq(nombreGrado));
          if (filas.length === 0) {
            cy.contains('Aún no hay resultados');
          } else {
            cy.get('.data-table').first().find('tbody tr').should('have.length', filas.length);
            cy.get('.data-table').first().find('tbody tr td:nth-child(3)').each(($td) => {
              expect($td.text().trim()).to.eq(nombreGrado);
            });
          }
        });
      });
  });
});
