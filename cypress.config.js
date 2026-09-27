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

// E2E contra el sistema real (frontend + backend + base de datos), no mocks,
// pero nunca contra producción: los tests crean datos. Se corren contra el
// backend local (`npm run dev:e2e` en edu-analitica-backend, rama "e2e" de
// Neon) y el frontend local (`npm run dev:e2e` aquí).
//
// - E2E_BASE_URL: dónde corre el frontend. Por defecto el dev server local.
// - E2E_API_URL: el backend que usa ESE frontend (el mismo VITE_API_URL con
//   el que se construyó). Los tests lo llaman directo para preparar datos.
// - Credenciales (secretas): cypress.env.json o CYPRESS_ADMIN_USER, etc.
//   Ver cypress.env.example.json y la sección E2E del README.
const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:5173/edu-analitica-frontend/';
const apiUrl = (process.env.E2E_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// El deploy de GitHub Pages está construido contra el backend de producción,
// así que también se bloquea aunque E2E_API_URL apunte a otro lado.
const PRODUCCION = [/\.github\.io$/, /^edu-analitica-backend-production\.up\.railway\.app$/];
for (const url of [baseUrl, apiUrl]) {
  if (PRODUCCION.some((patron) => patron.test(new URL(url).hostname))) {
    throw new Error(`E2E contra producción bloqueado (${url}). Usa el entorno e2e: ver README, sección E2E.`);
  }
}

export default defineConfig({
  e2e: {
    baseUrl,
    specPattern: 'cypress/e2e/**/*.cy.js',
    // La rama de Neon se suspende sin uso y tarda unos segundos en despertar.
    defaultCommandTimeout: 12000,
    requestTimeout: 15000,
    viewportWidth: 1366,
    viewportHeight: 768,
    // Un video por spec en cypress/videos (gitignored; se borran al empezar cada corrida).
    video: true,
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
    apiUrl,
  },
});
