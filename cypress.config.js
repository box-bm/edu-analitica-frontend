import fs from 'node:fs';
import { defineConfig } from 'cypress';

// Cookies de refresh guardadas entre corridas (gitignored), para no gastar
// logins: el backend permite 5 por IP cada 15 min. Ver cypress/support/commands.js.
const ARCHIVO_SESIONES = 'cypress/.sesiones.json';

const leerSesiones = () => {
  try {
    return JSON.parse(fs.readFileSync(ARCHIVO_SESIONES, 'utf8'));
  } catch {
    return {};
  }
};

// E2E contra el sistema real (frontend + backend + base de datos), no mocks.
//
// - E2E_BASE_URL: dónde corre el frontend. Por defecto el dev server local
//   (`npm run dev`); también puede ser el deploy de GitHub Pages.
// - E2E_API_URL: el backend que usa ESE frontend (el mismo VITE_API_URL con
//   el que se construyó). Los tests lo llaman directo para preparar datos.
// - Credenciales (secretas): cypress.env.json o CYPRESS_ADMIN_USER, etc.
//   Ver cypress.env.example.json y la sección E2E del README.
export default defineConfig({
  e2e: {
    baseUrl: process.env.E2E_BASE_URL ?? 'http://localhost:5173/edu-analitica-frontend/',
    specPattern: 'cypress/e2e/**/*.cy.js',
    // Railway puede tardar en despertar; el cliente del frontend espera hasta 10 s.
    defaultCommandTimeout: 12000,
    requestTimeout: 15000,
    viewportWidth: 1366,
    viewportHeight: 768,
    video: false,
    setupNodeEvents(on) {
      on('task', {
        leerSesion: (clave) => leerSesiones()[clave] ?? null,
        guardarSesion: ({ clave, valor }) => {
          fs.writeFileSync(ARCHIVO_SESIONES, JSON.stringify({ ...leerSesiones(), [clave]: valor }, null, 2));
          return null;
        },
      });
    },
  },
  expose: {
    apiUrl: (process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  },
});
