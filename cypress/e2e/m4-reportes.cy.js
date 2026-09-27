// Módulo 4 — reportes por sección y módulo.
// Matriz: M4-01 … M4-06, más los casos mínimos de QA de permisos (admin sin
// registro, docente sin acceso a secciones ajenas).
// Fuera de Cypress: M4-07 (revisar que la tabla reportes solo guarde url_pdf, manual).
//
// Preparación: una sección nueva con dos grupos que resuelven la misma
// actividad de Matemática, uno con todo bien y otro con una sola bien. Así el
// mejor y el peor grupo son conocidos. Computación queda sin resultados.
import {
  crearGrupo,
  crearSeccion,
  desactivar,
  entrarGrupo,
  modulosDeUnGrado,
  primeraActividad,
  resolverActividad,
  rutaApi,
  uid,
} from '../support/datos';

const COLUMNAS_CSV = 'id_grupo,grupo,grado,seccion,modulo,actividad,puntaje,puntaje_total,porcentaje,fecha';

describe('Módulo 4 — reportes por sección y módulo', () => {
  const ctx = { grupos: [] };

  before(() => {
    cy.token('admin').then((tokenAdmin) => {
      modulosDeUnGrado(tokenAdmin).then((modulos) => {
        Object.assign(ctx, modulos);
        crearSeccion(tokenAdmin, modulos.idGrado).then((seccion) => {
          ctx.seccion = seccion;
        });
        // Una segunda sección donde el docente no tiene grupos (para el 403).
        crearSeccion(tokenAdmin, modulos.idGrado).then((ajena) => {
          ctx.seccionAjena = ajena;
        });
      });
    });

    cy.token('docente').then((tokenDocente) => {
      const mejor = `E2E Mejor ${uid()}`;
      const peor = `E2E Peor ${uid()}`;
      ctx.nombres = { mejor, peor };

      for (const [nombre, todoBien] of [
        [mejor, true],
        [peor, false],
      ]) {
        cy.then(() => crearGrupo(tokenDocente, ctx.seccion.id, nombre)).then((grupo) => {
          ctx.grupos.push(grupo.id);
          entrarGrupo(grupo.codigoAcceso).then((tokenGrupo) => {
            primeraActividad(tokenGrupo, ctx.matematica.id).then((actividad) => {
              ctx.actividad = actividad;
              resolverActividad({
                tokenDocente,
                tokenGrupo,
                idActividad: actividad.id,
                aciertos: todoBien ? Infinity : 1,
              });
            });
          });
        });
      }
    });
  });

  after(() => {
    cy.token('docente').then((token) => {
      for (const id of ctx.grupos) desactivar(token, `/api/grupos/${id}`);
    });
    cy.token('admin').then((token) => {
      for (const s of [ctx.seccion, ctx.seccionAjena]) if (s) desactivar(token, `/api/secciones/${s.id}`);
    });
  });

  // Abre Reportes con la sección E2E y el módulo pedido.
  // Los alias solo capturan las peticiones de ese filtro (al abrir la pestaña
  // primero se carga la sección y el módulo por defecto).
  // Varios tests piden la misma URL: sin If-None-Match el navegador no usa su
  // caché y la respuesta es siempre 200 con body, nunca 304.
  const abrirReporte = (rol, modulo) => {
    const query = { id_seccion: String(ctx.seccion.id), id_modulo: String(modulo.id) };
    const sinCache = (req) => delete req.headers['if-none-match'];
    cy.intercept({ method: 'GET', url: rutaApi('/api/reportes/vista-previa*'), query }, sinCache).as('vistaPrevia');
    cy.intercept({ method: 'GET', url: rutaApi('/api/reportes?*'), query }, sinCache).as('historial');
    cy.visitarComo(rol, rol === 'admin' ? '/admin' : '/docente');
    cy.irA('Reportes');
    cy.contains('label', 'Sección').find('select').select(String(ctx.seccion.id));
    cy.contains('label', 'Módulo').find('select').select(String(modulo.id));
    cy.wait('@vistaPrevia').its('response.statusCode').should('eq', 200);
  };

  it('M4-01: la vista previa muestra las estadísticas de la sección y el módulo', () => {
    abrirReporte('docente', ctx.matematica);

    cy.get('@vistaPrevia').then(({ response }) => {
      const datos = response.body;
      expect(datos.hayResultados).to.eq(true);
      expect(datos.totales.grupos).to.eq(2);
      expect(datos.totales.intentos).to.eq(2);
      expect(datos.mejorGrupo.nombreGrupo).to.eq(ctx.nombres.mejor);
      expect(datos.peorGrupo.nombreGrupo).to.eq(ctx.nombres.peor);
      expect(datos.mejorGrupo.promedioPuntaje).to.eq(100);

      cy.statCard('Promedio de aciertos').should('have.text', `${datos.totales.promedioPuntaje}%`);
      cy.statCard('Intentos').should('have.text', '2');
      cy.statCard('Grupos').should('have.text', '2');
      cy.statCard('Mejor desempeño').should('have.text', ctx.nombres.mejor);
      cy.statCard('Conviene reforzar').should('have.text', ctx.nombres.peor);
    });
    cy.contains('tr', ctx.nombres.mejor).should('contain', '100%');
    cy.contains('tr', ctx.nombres.peor).should('not.contain', '100%');
  });

  it('M4-02: sin resultados muestra un estado vacío, no un error', () => {
    abrirReporte('docente', ctx.computacion);
    cy.get('@vistaPrevia').its('response.body.hayResultados').should('eq', false);
    cy.contains('Aún no hay resultados').should('be.visible');
    cy.get('.form-error').should('not.exist');
  });

  it('M4-03: exportar CSV descarga las columnas esperadas', () => {
    cy.intercept('GET', rutaApi('/api/reportes/export*')).as('export');
    abrirReporte('docente', ctx.matematica);
    cy.contains('button', 'Exportar CSV').click();

    cy.wait('@export').then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      const nombre = /filename="([^"]+)"/.exec(response.headers['content-disposition'])[1];
      cy.readFile(`${Cypress.config('downloadsFolder')}/${nombre}`).then((csv) => {
        const lineas = csv.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
        expect(lineas[0]).to.eq(COLUMNAS_CSV);
        expect(lineas).to.have.length(3); // encabezado + un intento por grupo
        expect(csv).to.contain(ctx.nombres.mejor).and.contain(ctx.nombres.peor);
      });
    });
  });

  it('M4-05: un link que no es http(s) no se registra', () => {
    cy.intercept('POST', rutaApi('/api/reportes'), cy.spy().as('registrar'));
    abrirReporte('docente', ctx.matematica);

    for (const invalido of ['esto no es un link', 'javascript:alert(1)']) {
      cy.contains('label', 'Link del PDF').find('input').clear().type(invalido);
      cy.contains('button', 'Registrar').click();
      cy.get('.form-error').should('contain', 'https://');
    }
    cy.get('@registrar').should('not.have.been.called');
  });

  it('M4-04 / M4-06: registrar un link válido y ver el historial filtrado', () => {
    const urlMatematica = `https://drive.google.com/file/d/e2e-${uid(8)}/view`;
    const urlComputacion = `https://drive.google.com/file/d/e2e-${uid(8)}/view`;

    // Un reporte de otro módulo en la misma sección, que no debe salir en Matemática.
    cy.token('docente').then((token) =>
      cy.api(token, 'POST', '/api/reportes', {
        idSeccion: ctx.seccion.id,
        idModulo: ctx.computacion.id,
        urlPdf: urlComputacion,
      })
    );

    cy.intercept('POST', rutaApi('/api/reportes')).as('registrar');
    abrirReporte('docente', ctx.matematica);
    cy.wait('@historial');
    cy.contains('label', 'Link del PDF').find('input').type(urlMatematica);
    cy.contains('button', 'Registrar').click();

    cy.wait('@registrar').its('response.statusCode').should('eq', 201);
    cy.contains('Reporte registrado. Ya aparece en el historial.');

    // M4-04: el link abre en otra pestaña, nunca embebido.
    cy.get(`a[href="${urlMatematica}"]`)
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer');

    // M4-06: solo los reportes de esta sección y módulo.
    cy.wait('@historial').then(({ request, response }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get('id_seccion')).to.eq(String(ctx.seccion.id));
      expect(url.searchParams.get('id_modulo')).to.eq(String(ctx.matematica.id));
      response.body.forEach((r) => {
        expect(r.seccion.id).to.eq(ctx.seccion.id);
        expect(r.modulo.id).to.eq(ctx.matematica.id);
      });
    });
    cy.get(`a[href="${urlComputacion}"]`).should('not.exist');

    cy.contains('label', 'Módulo').find('select').select(String(ctx.computacion.id));
    cy.get(`a[href="${urlComputacion}"]`).should('exist');
    cy.get(`a[href="${urlMatematica}"]`).should('not.exist');
  });

  it('Permisos: admin ve la vista previa pero no puede registrar', () => {
    abrirReporte('admin', ctx.matematica);
    cy.statCard('Intentos').should('have.text', '2');
    cy.contains('Registrar reporte').should('not.exist');
    cy.contains('label', 'Link del PDF').should('not.exist');
  });

  it('Permisos: el docente no puede ver ni registrar reportes de una sección sin grupos suyos', () => {
    cy.token('docente').then((token) => {
      const query = `id_seccion=${ctx.seccionAjena.id}&id_modulo=${ctx.matematica.id}`;
      cy.api(token, 'GET', `/api/reportes/vista-previa?${query}`, undefined, { failOnStatusCode: false })
        .its('status')
        .should('eq', 403);
      cy.api(
        token,
        'POST',
        '/api/reportes',
        { idSeccion: ctx.seccionAjena.id, idModulo: ctx.matematica.id, urlPdf: 'https://drive.google.com/x' },
        { failOnStatusCode: false }
      )
        .its('status')
        .should('eq', 403);
    });
  });
});
