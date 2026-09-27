# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

EduAnalítica is an educational web platform (graduation seminar project, UMG) built for Colegio Mixto Juventud San Francisco. It reinforces basic math and computer skills for 1st–3rd grade students through interactive activities, with performance analysis backed by Python/Colab on the side.

This repo is the **frontend**. It's meant to consume the `edu-analitica-backend` REST API (Express + TypeORM, sibling repo `../edu-analitica-backend`). Both repos should stay aligned on the API contract — see "Backend API contract" below.

Team: Jose (frontend, owner of this repo) · Antony (backend) · María José (QA) · Brandon (architect) · Josue (PO).

**Staffing update (2026-09-26):** the rest of the team can't take Módulo 3, so Brandon is building it (frontend + backend) together with a visual redesign, on branch `feat/modulo-3-y-rediseno`.

**Earlier staffing note (as of 2026-09-18):** Jose is on vacation, back the week of 2026-09-21. Brandon (architect) is covering the frontend seat this week, working in parallel with Antony on backend, to keep the Módulo 2 auth/Secciones slice moving. See "Auth: real bug found" below for the active work item.

### Environment & UX constraints (drive real UI decisions)

- Runs on **Windows 10** with a modern browser (Edge/Chrome) on the school's computers. No Windows 7/XP support needed, so modern JS/CSS is fine without heavy polyfills.
- The `estudiante` role is used by **children aged 7–10**. That section's UI must stay simple and visual with minimal text, large buttons, and no wording that reads as failure (avoid "Reprobaste", red/negative tone, etc. — use a neutral, motivational framing instead).

## Commands

```bash
npm run dev        # start Vite dev server (http://localhost:5173/edu-analitica-frontend/)
npm run build      # production build to dist/
npm run preview    # preview the production build
npm run lint       # eslint .
npm test           # vitest run — unit/integration tests, no network, no dev server needed
npm run test:watch # vitest in watch mode
npm run e2e        # cypress run — E2E against the real system (needs cypress.env.json, see "Cypress E2E" below)
npm run e2e:open   # same, with the Cypress UI
```

**Testing (2026-09-19):** Vitest + React Testing Library, configured in `vite.config.js` (`test` block) with `tests/setup.js` loading `@testing-library/jest-dom`. Chosen over Cypress E2E (the original plan, see "Planned testing setup" below) because it needs no running dev server or live backend — tests mock `userService` and use a fake axios adapter, so they run in under a second and are safe for CI. Current coverage (`tests/`):
- `apiClient.test.js` — the Authorization interceptor (the exact bug fixed above): no header with no token, `Bearer <token>` once `setAccessToken` is called, cleared again after logout.
- `AuthContext.test.jsx` — `restoreSession` on mount (success and failure), `login()`, `logout()`, and that the accessToken each of these produces actually reaches outgoing requests (integration-style, using the real `apiClient`, only `userService` is mocked).
- `PrivateRoute.test.jsx` — loading state, redirect when unauthenticated, redirect to `/no-autorizado` on role mismatch, renders children when authorized.
- `grupoClient.test.js` — the group token is attached independently of the docente/admin accessToken, no cookies, a 401 on a group route fires the expiry callback but a 401 on `grupo-login` (wrong code) doesn't.
- `AccesoGrupo.test.jsx` — code input normalization (uppercase, symbols stripped, max 6), button disabled until complete, success navigates to `/grupo/modulos`, wrong code shows a friendly message.
- `estrellas.test.js` — at least 1 star always, thresholds, and no failure-sounding words in kid-facing result copy.
- `UsuariosAdmin.test.jsx` — lists from the API, own account can't be deactivated, deactivating another user calls the API and reloads, editing without a new password doesn't send `password`.
- `useCarga.test.jsx` — success, error and `recargar()`.

This does **not** replace the live-deploy validation from "Auth: real integration fixed" above — these are fast regression tests for the logic, not a substitute for testing against the real backend before shipping an auth-related change.

**CI (2026-09-21):** `.github/workflows/deploy.yml` runs `npm test` right before the build step — a failing test blocks the GitHub Pages deploy, it doesn't just report red somewhere. `.github/workflows/ci.yml` runs the same suite on every PR targeting `main` (deploy.yml only triggers on push to `main`, so PRs had no automated check before this). **Node version gotcha hit and fixed:** `jsdom` v30 requires Node `^22.22.2 || ^24.15.0 || >=26.0.0` — the first CI run failed on Node 20 even though it passed locally (local Node was 26). Both workflows now pin `node-version: 22`, and `package.json` declares `engines.node: ">=22.22.2"` so this doesn't quietly bite anyone running tests locally on an older Node either.

## Architecture (current implementation)

React 19 + Vite SPA (`login-react` in package.json), plain JavaScript (`.jsx`, not TypeScript) with plain CSS (no Tailwind). Deployed to GitHub Pages at the `/edu-analitica-frontend/` subpath — `vite.config.js` sets `base` accordingly and `App.jsx` passes `basename={import.meta.env.BASE_URL}` to the router, so both must stay in sync with the repo name.

Roles on the backend are stored lowercase (`administrador`, `docente`, `estudiante`); the frontend uses capitalized role strings (`Admin`, `Docente`, `Estudiante`) — this mapping happens on the backend response, not in this repo.

### Auth: real integration fixed and validated end-to-end (2026-09-19)

`src/services/userService.jsx` no longer uses mocks (the old `MOCK_USERS` array is left commented out for reference — safe to delete, nothing depends on it). It calls the real backend through `apiClient`: `login`, `refresh`, `logout`, `me` all hit `edu-analitica-backend` (`POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/usuarios/me`). `src/services/apiClient.jsx` is an axios instance with `baseURL` from `VITE_API_URL` and `withCredentials: true` so the httpOnly refresh cookie survives the cross-domain request to Railway.

**Validated end-to-end against the live deploy, twice, after the fix below (2026-09-19, `box-bm.github.io/edu-analitica-frontend/` ↔ Railway):** ✅ login, ✅ reload (session now persists), ✅ logout (session actually revoked server-side — a subsequent refresh with the same cookie returns 401). The full loop works.

**The bug that was here (now fixed, commit `b02fcbd`):** the backend was always fine — `POST /api/auth/login` and `POST /api/auth/refresh` both return `{accessToken}`, and `GET /api/usuarios/me` returns 200 given `Authorization: Bearer <that token>`. The frontend bug was that `AuthContext.jsx` never stored the `accessToken` anywhere and `apiClient.jsx` had no interceptor to attach it, so on reload `refresh()` got a valid token that was discarded, `me()` went out with no `Authorization` header, got 401, and `PrivateRoute` bounced to login. Fixed by:
- `apiClient.jsx`: added a module-level, in-memory-only `accessToken` holder (`setAccessToken` export — never `localStorage`, per the security requirement below) plus a request interceptor that attaches `Authorization: Bearer <token>` when one is set.
- `AuthContext.jsx`: calls `setAccessToken(...)` after a successful `login()` and after a successful `refresh()` in `restoreSession()`; calls `setAccessToken(null)` in `logout()`.

**Minor, not blocking:** field-shape mismatch between `POST /api/auth/login`'s `usuario: {id, nombre, rol}` (flat string `rol`) and `GET /api/usuarios/me`'s `{nombreCompleto, usuario, rol: {id, nombreRol}}` — already handled correctly by manual mapping in both places in `AuthContext.jsx`, but worth aligning with Antony later so this class of bug doesn't recur.

**Cleanup done (2026-09-26):** the old commented-out AuthContext (with the stale `hasPermission`) is gone; `npm run lint` is clean and now runs in `ci.yml`.

### Routing and role gating

`App.jsx` defines all routes and wraps role-specific ones in `PrivateRoute` (`src/routes/PrivateRoute.jsx`), which redirects to `/` if not authenticated or `/no-autorizado` if the role doesn't match. The root route `/` renders `Login` unless already authenticated, in which case it redirects by role. Role → route mapping (`docente → /docente`, `administrador → /admin`) is duplicated in both `login.jsx` (`redirigirPorRol`) and `App.jsx` (`RutaInicio`) — update both if roles or routes change. There is no `estudiante` route anymore: students enter through `/grupo` (Módulo 3).

Even once real auth lands, the backend must be treated as the source of truth for authorization — the frontend role check (hiding a route/button) is UX only, never a security boundary.

### Dashboard pattern (admin/docente)

Each role has a thin top-level page (`src/pages/admin.jsx`, `docente.jsx`) that builds a `menuItems` array of `{ label, icon, content }` and renders `<DashboardLayout menuItems={...} />`. `DashboardLayout` (`src/components/DashboardLayout.jsx`) owns the sidebar/topbar chrome and just renders the `content` of whichever item is selected — it has no knowledge of what each section contains. Section content itself lives in per-role subfolders (`src/pages/admin/*`, `src/pages/docente/*`), one component per menu item. `src/pages/estudiante/*` now holds only the Módulo 3 group flow, which uses `GrupoLayout`, not `DashboardLayout`.

Shared dashboard UI pieces (`StatCard`, `Badge`, and `widgets.css` with `.panel`, `.kpi-grid`, `.data-table`, `.dashboard-form`, etc.) live in `src/components/dashboard/` and are reused across the admin and docente sections.

### Data layer: real API only (2026-09-26)

**There is no mock data anymore** — `src/data/mockData.js` was deleted. Every screen reads the backend through a service in `src/services/` (each returns `{ success, data, error }`). Pages load with the `useCarga(cargar)` hook (`src/hooks/useCarga.js`: `{ datos, error, cargando, recargar }`); pass a **stable** loader (module-level function or `useCallback`), otherwise it refetches on every render. Rule going forward: only fall back to mock data for a feature whose backend module doesn't exist yet, and label it as such in the UI.

- Admin: `Inicio` → `GET /api/reportes/resumen`; `Usuarios` → `/api/usuarios` CRUD (create/edit modal, activate/deactivate; own account can't be deactivated or demoted — enforced by the backend too; empty password on edit is not sent); `Secciones` → `/api/secciones`; `Reportes` → shared `Reportes` component: Módulo 4 by sección/módulo (read-only for admin) + `GET /api/reportes/actividades` + CSV export.
- Docente: `Inicio` → the same resumen endpoint (backend scopes it to the docente's groups); `Grupos`; `Actividades`; `Reportes` → same `Reportes` component as admin (Módulo 4 view + `ReporteActividades`).
- Removed because no backend module exists and they contradicted the Módulo 3 model (groups, no individual students, no 0–5 grades): docente `Cursos` and `Estudiantes`, admin `Configuración`.
- Charts live in `src/components/reportes/` (`GraficasResumen`, `ReporteActividades`, `colores.js`). Colors were validated with the dataviz validator: single series `#149e94`; level ramp (inicial → alto) `#5cbfb4 / #1f9a8f / #0b5f59`. Level thresholds (≥90% alto, ≥60% medio) are the same as `src/utils/estrellas.js` and the backend — change all three together.
- The CSV download goes through axios with `responseType: 'blob'` (the route needs the `Authorization` header, a plain `<a href>` wouldn't send it); the filename comes from `Content-Disposition`, which the backend exposes via CORS.
- Grado filters use `seccionesService.listarGradosConSecciones()` — the docente can't read `/api/grados`.

### Layout gotcha

`DashboardLayout`'s content area (`main.dashboard-content`) is a flex child and needs `min-width: 0` (already set) for wide tables to scroll inside `.panel`'s `overflow-x: auto` instead of overflowing the page — keep this in mind if the flex layout is restructured.

### Visual system (redesign, 2026-09-26)

"Escolar cálido y lúdico": navy ink from the logo + orange / teal / yellow accents on cream "paper", rounded fonts (Baloo 2 for headings, Nunito for body, loaded from Google Fonts in `index.html` with system fallbacks). **All colors are CSS custom properties in `src/index.css`** (`--ink`, `--paper`, `--orange`, `--teal`, `--sun`, `--grape`, `--sky`, `--leaf`, each with `-soft`/`-deep` variants) — use tokens, not hex, in new CSS. Shared buttons (`.btn-primary` orange, `.btn-teal`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`) and `.cargando` / `.estado-vacio` live there too. The old blue hex values in pages were remapped to the palette. Light theme only (`color-scheme: light`).

- `DashboardLayout`: fixed sidebar on desktop (no more hover-to-expand), drawer with scrim under 900px, greeting + date + role chip + initials avatar in the topbar. Menu items accept an optional `color`; otherwise they cycle through the palette.
- `StatCard` takes `accent` as any CSS color (tokens like `var(--teal)` work) via the `--accent` custom property.
- `Modal` accepts `wide` (760px) and has `role="dialog"`.
- Kids' zone styles are in `src/pages/estudiante/grupo.css` (big buttons `.boton-grande`, module colors via `.color-<name>`). **No red anywhere in the kids' zone** — questions to review use yellow with a 💡, results always show at least 1 star.

**React Compiler gotcha (hit and fixed in `ActividadesDocente.jsx`):** `babel-plugin-react-compiler` memoizes closures keyed on the property paths they read. A handler that reads `editor.form…` from a nullable state value crashed on first render with `Cannot read properties of null (reading 'form')`, even though the handler was never called. Fix pattern: use functional `setState(prev => …)` updates, or render the stateful sub-UI in a child component that only mounts when the value is non-null (what `EditorActividad` does).

## Original project spec vs. what's actually built

The project's original planning doc (from Brandon/architect) describes a different target than what exists in this repo today. Treat the items below as **not yet implemented** — don't assume TypeScript types, Tailwind classes, Cypress tests, or an activities-based student flow exist just because they're referenced in planning materials.

- **Stack:** spec calls for TypeScript (strict, no `any`) + Tailwind CSS + Cypress E2E, deployed to Vercel/Netlify. Actual: plain JS/JSX, plain CSS, no test runner, deployed to GitHub Pages.
- **Student flow:** spec describes an activities-based flow (`estudiante/SeleccionModulo`, `Actividad`, `Resultado` — pick a module, do an interactive activity, see a result) with a docente-side activity builder (`docente/CrearActividad`, max 10 questions per activity). Actual: this repo implements a grades/reports **dashboard** (courses, `NOTAS` grade matrix, KPI/report views) for all three roles — there's no activity-taking or activity-authoring UI yet. Confirm with the team whether the dashboard is a first phase alongside the activities flow, or a pivot away from it, before building either further.
- **Folder/file naming:** spec uses PascalCase `.tsx` files (`Login.tsx`, `AppLayout.tsx`, `ProtectedRoute.tsx`/`RoleRoute.tsx`). Actual repo uses lowercase `.jsx` (`login.jsx`, `DashboardLayout.jsx`, `PrivateRoute.jsx`) with a single `PrivateRoute` handling both "is authenticated" and "has role" checks instead of two separate route wrappers.

### Real auth model (planned, not implemented)

When real auth replaces the mock, this is the model the spec calls for:

- `accessToken` lives only in `AuthContext` (in memory) — **never** `localStorage` (XSS risk).
- `refreshToken` lives in an httpOnly cookie set by the backend; the frontend never touches it directly.
- On app mount/reload: call `POST /api/auth/refresh` (cookie sent automatically) to restore the session silently.
- Authenticated requests send `Authorization: Bearer <accessToken>`.
- The role decoded from the token drives what the `Sidebar`/nav shows, but that's UX only — the backend revalidates the role on every endpoint.

### Backend API contract (for when real integration happens)

Keep this in sync with `edu-analitica-backend` — if an endpoint's shape changes on that side, update it here before relying on it.

```
POST /api/auth/login    body: {usuario, password}    → {accessToken, usuario}
POST /api/auth/refresh  → {accessToken}
POST /api/auth/logout   → 204

GET/POST/PUT/DELETE /api/usuarios
GET/POST/PUT         /api/modulos
GET/POST             /api/grados          implemented on backend, admin-only
GET/POST/PUT/DELETE  /api/secciones?id_grado=   implemented; admin page in SeccionesAdmin.jsx; GET also allowed for docente (Módulo 3)
GET                  /api/admin/resumen

GET/POST/PUT/DELETE /api/actividades   implemented (Módulo 3) — preguntas go inside the activity body, max 10, see Módulo 3 below
GET           /api/docentes/me/resultados?grado=&modulo=
GET           /api/reportes/resumen | /actividades | /resultados.csv   ?id_grado=   implemented (2026-09-26), admin + docente
GET/POST      /api/reportes, /api/reportes/vista-previa, /api/reportes/export, /api/reportes/:id   Módulo 4, implemented — see below (replaces the old /api/reportes/:id/export and /:id/pdf sketches)
GET           /api/usuarios/me   implemented
```

### Secciones (backend ready, frontend page not built yet)

Módulo 2 (ampliado) adds a `secciones` concept alongside `grados`, so the school can organize students into real groups (e.g. "1ro A", "1ro B") instead of just a grade level. `secciones` relates 1-to-many to `grados` (`id_grado` FK, unique on `id_grado + nombre_seccion`, soft-deleted via `activa`). The student/group model is now defined (see "Módulo 3: actividades y acceso por grupo" below) and it hangs off `secciones`, not `grados` directly.

**Backend is done**: `GET/POST /api/grados` and `GET/POST/PUT/DELETE /api/secciones?id_grado=` are implemented, admin-only, with duplicate validation and soft-delete (see `edu-analitica-backend` CLAUDE.md "Current entregable"). Nothing on the frontend consumes them yet — this is the next concrete piece of work here:

- New Admin-only page, `Secciones` (a table + create/edit modal with a Grado select), added as a tab in the admin dashboard next to Usuarios/Módulos/Grados — follow the same `src/pages/admin/*` + `menuItems` pattern described above (see `src/pages/admin/UsuariosAdmin.jsx` for the closest existing table+modal example to copy from).
- Will need a `gradosService`/`seccionesService` (or extend an existing service file) wrapping `apiClient` calls to the two endpoints above.
- Grado select in the create/edit modal should be populated from `GET /api/grados`.

### Módulo 3: actividades y acceso por grupo — implemented (2026-09-26)

Decisions confirmed: **one access code per group** (no individual PINs), and activities come from a **seeded base catalog plus docente-authored activities**. Backend contract and security model are documented in `../edu-analitica-backend/CLAUDE.md` ("Módulo 3") — keep both in sync. Validated end to end against the real backend running locally (Postgres + seed), in a browser, for the kids' flow and the docente pages; **not yet validated against the Railway/GitHub Pages deploy** (the backend branch must be deployed and `npm run seed:actividades` run there first).

**Kids' zone (group session, not `AuthContext`):**
- Routes: `/grupo` (`AccesoGrupo.jsx`, code entry, linked from the login's yellow "¿Eres estudiante?" card), `/grupo/modulos` and `/grupo/modulos/:idModulo` (`SeleccionModulo.jsx`), `/grupo/actividad/:idActividad` (`Actividad.jsx`, one question at a time, 2–4 big colored options), `/grupo/resultado` (`Resultado.jsx`, stars + review; reached only via router state, a reload redirects to modules). All but `/grupo` are wrapped in `GrupoRoute`, which renders `GrupoLayout` or redirects to `/grupo`.
- `src/services/grupoClient.jsx` is a **separate axios instance** with its own in-memory token (never `localStorage`) and no `withCredentials`. A 401 from any group route (token expired after 45 min, or the docente regenerated the code) calls the callback registered by `GrupoContext`, which clears the session; `/grupo` then shows "Se acabó el tiempo…". A reload also drops the session by design.
- `src/context/GrupoContext.jsx` (`useGrupo`: `grupo`, `activo`, `expirada`, `entrar(codigo)`, `salir()`); `GrupoProvider` wraps the router in `App.jsx`.
- Stars: `src/utils/estrellas.js` (≥90% → 3, ≥60% → 2, else 1) with the result copy.

**Docente pages** (added to `MENU_DOCENTE`):
- `Grupos.jsx` — KPIs, group cards with the big access code, per-module progress, "Nuevo código" / "Desactivar" behind confirmation modals (no `window.confirm`), create modal (sección select from `GET /api/secciones`, now allowed for docente), recent results table.
- `ActividadesDocente.jsx` — catalog + own activities with grado filter and "Solo mis actividades"; catalog items open read-only with a "Crear una copia editable" shortcut; editor with up to 10 questions (counter, "+ Agregar pregunta" disabled at 10), 2–4 options each, radio for the correct one, client-side validation mirroring the backend's Zod rules. On edit, preguntas are only sent if they changed, because the backend returns 409 when replacing preguntas of an activity a group already solved.

**Services:** `grupoService.jsx` (kid-friendly error messages), `gruposService.jsx`, `actividadesService.jsx` (surfaces the first Zod field error from a 400).

**API contract (implemented):**
```
POST /api/auth/grupo-login              [public]       {codigo_acceso} → {token, grupo}
GET  /api/grupo/me/actividades          [grupo token]  modules → activities (completada, mejorPuntaje)
GET  /api/grupo/me/avance               [grupo token]
GET  /api/actividades/:id/preguntas     [grupo token]  no correct answers
POST /api/actividades/:id/respuestas    [grupo token]  {respuestas:[{idPregunta, respuesta}]} → {puntaje, puntajeTotal, porcentajeModulo, detalle[]}

POST   /api/grupos | GET /api/docentes/me/grupos | PUT /api/grupos/:id/regenerar-codigo | DELETE /api/grupos/:id   [docente]
GET    /api/docentes/me/resultados?id_grupo=     [docente]
GET    /api/modulos                              [docente, admin]
GET    /api/docentes/me/actividades              [docente]
GET/PUT/DELETE /api/actividades/:id, POST /api/actividades   [docente]
```

**UX note (kids copying a code from the whiteboard):** the access code format should avoid ambiguous characters (O/0, I/1) — confirm with Antony that the backend generator excludes them before changing `AccesoGrupo.jsx`'s input normalization.

**Mock data is gone** — see "Data layer: real API only" above. The old `/estudiante` grades dashboard (and its mock-only pages) was **removed** on 2026-09-26: no `estudiante` accounts can exist on the backend, so it was unreachable. Unused template assets (`App.css`, `hero.png`, `react.svg`, `vite.svg`, `public/icons.svg`) and the now-unused `logo2.png` were removed too.

### Módulo 4: Reportes — frontend on `feat/modulo-4-reportes` (PR #24), backend on its own `feat/modulo-4-reportes` (2026-09-27)

Closes the reports flow that was a placeholder since Módulo 2. Full scope doc: `alcance-modulo4-reportes.md`; backend contract in `../edu-analitica-backend/CLAUDE.md` ("Módulo 4"). Goals: (1) export results per sección/módulo as CSV for manual analysis in Colab, (2) register the link of the externally generated PDF (Colab → Google Drive), (3) an always-available **vista previa** computed by the backend (no Colab dependency), (4) open the final report.

**Colab is manual, not integrated.** Someone downloads the CSV, runs the notebook by hand, uploads the PDF to Drive and pastes the link back. No Google Drive API. The backend **never stores the PDF** (Railway's filesystem is ephemeral) — `reportes` only keeps `url_pdf`.

**Permissions by role — `src/utils/permisos.js` (`PERMISOS_REPORTES`, `permisosReportes(rol)`):**
- `administrador`: `ver` (vista previa, export, history of every docente) over **all** active secciones; **cannot register**.
- `docente`: `ver` + `registrar`, only over secciones where they have groups (backend: 403 elsewhere, and history/detail filtered to their own reportes).
- Any other role gets nothing. To enable a role, add it to the table **by hand** and to `roleMiddleware` in the backend's `reportes.routes.ts` — the table is UX only, the backend is the real gate.

**Frontend implementation:**
- Both the admin and docente `Reportes` tabs render `src/components/reportes/Reportes.jsx`: a view switch between "Por sección y módulo" (Módulo 4, default, only if the role has `ver`) and "Aciertos por actividad" (the pre-existing `ReporteActividades`, unchanged).
- `src/components/reportes/seccion/`: `ReportesSeccion` (filters; secciones from `GET /api/docentes/me/grupos` for `'propias'` or `GET /api/secciones` for `'todas'`; módulos from `GET /api/modulos` filtered to the sección's grado; defaults to the first of each), `PanelReporte` (mounted with `key` per filter; hides the register form when the role can't register), `VistaPrevia`, `RegistrarReporte`, `HistorialReportes`, `formato.js`.
- `src/utils/urlPdf.js` (`esUrlPdfValida`): http(s) only, ≤500 chars. Checked before POSTing **and** when rendering history — a stored non-http link shows "Link no válido", never an `<a>`. Links open in a new tab (`target="_blank" rel="noopener noreferrer"`), never embedded.
- `reportesService`: `vistaPrevia`, `exportarCsv`, `historial`, `registrar` (shared blob-download helper with the old `descargarCsv`). No `detalle(id)` call yet — history rows already carry `urlPdf`.
- Tests: `tests/ReportesSeccion.test.jsx` (docente + admin), `tests/urlPdf.test.js`, `tests/permisos.test.js`.
- **Not yet validated against the real backend** (unit tests mock the services with the backend's real shapes). Do a browser pass against the backend branch before merging PR #24.

**API contract (implemented in the backend):**
```
GET  /api/reportes/vista-previa?id_seccion=&id_modulo=   [admin, docente]  both params required
  → { seccion{id,nombreSeccion,grado}, modulo{id,nombreModulo,icono}, hayResultados,
      totales{grupos,intentos,promedioPuntaje},
      grupos[{idGrupo,nombreGrupo,activo,intentos,promedioPuntaje,actividadesCompletadas,actividadesDisponibles,ultimoIntento}],
      mejorGrupo{idGrupo,nombreGrupo,promedioPuntaje}|null, peorGrupo|null (null unless ≥2 groups have attempts) }
GET  /api/reportes/export?id_seccion=&id_modulo=         [admin, docente]  CSV: id_grupo,grupo,grado,seccion,modulo,actividad,puntaje,puntaje_total,porcentaje,fecha
POST /api/reportes                                       [docente]         body camelCase {idSeccion, idModulo, urlPdf} → 201 Reporte
GET  /api/reportes?id_seccion=&id_modulo=                [admin, docente]  Reporte[] newest first
GET  /api/reportes/:id                                   [admin, docente]  Reporte (404 for another docente's)
Reporte = { id, urlPdf, generadoEn, seccion{id,nombreSeccion,grado}, modulo{id,nombreModulo}, docente{id,nombreCompleto} }
```
Gotchas: `promedioPuntaje` is a 0–100 percentage. In `/api/reportes` responses `seccion.grado` is a **string**, while `/api/secciones` and `/api/docentes/me/grupos` send it as an object — `formato.etiquetaSeccion` handles both. Query params stay snake_case (`id_seccion`), bodies are camelCase like the rest of the API (the scope doc's snake_case body was dropped).

**Usage flow:** filter → vista previa → Exportar CSV → run the notebook in Colab (outside the platform) → upload PDF to Drive → paste link in "Registrar reporte" → appears in the historial.

**QA minimum cases:** vista previa correct with results and an empty state without them; CSV has the expected columns; invalid URL (plain text, `javascript:`) → validation error; historial filtered by sección/módulo; a docente can't see/register reports for secciones that aren't theirs; admin sees everything but has no register form.

**Out of scope:** automating the CSV → Colab upload or PDF download (Drive API), and charts/analysis inside the platform for this flow (lives in the Colab notebook).

### Real integration: auth against the live backend — done

The Módulo 1 auth flow — login, refresh, logout, protected routes, and `usuarios/me` — is wired to Antony's deployed backend (Railway) instead of `MOCK_USERS`, and the full loop (login → reload → logout) is confirmed working end-to-end against production as of 2026-09-19 (see "Auth: real integration fixed and validated end-to-end" above).

- `apiClient`'s `baseURL` comes from `VITE_API_URL`, `withCredentials: true` is set, and the backend's refresh cookie (`sameSite=none; secure=true` in production) is correctly sent/received cross-domain — verified: login sets the cookie, refresh reads it and returns a valid new token, logout revokes it server-side.
- CORS is correctly scoped (`Access-Control-Allow-Credentials: true`, `Access-Control-Allow-Origin` matching this deploy's exact GitHub Pages origin) — confirmed via response headers.
- Infra is live end-to-end: Neon Postgres + Railway deploy on the backend (test users, roles, and `grados`/`secciones` data already seeded), GitHub Pages on this repo.

This piece of Módulo 2 is closed. The `Secciones` admin page is done (`SeccionesAdmin.jsx`); next active frontend work is Módulo 4 (Reportes, above).

This round of integration is scoped to auth + Secciones only — the rest of the Módulo 2 backend surface (`actividades`, `reportes`) stays out of scope for now. The student/group model that was previously blocking that work is now resolved — see "Módulo 3: actividades y acceso por grupo" above for what that unblocks.

### Cypress E2E — done (2026-09-27, #8)

Cypress 16 (`cypress.config.js`, JS like the rest of the repo) drives the **real** system — frontend + backend + DB, no mocks — following the project's test matrix. One spec per module in `cypress/e2e/` (`m1-auth`, `m2-admin`, `m2-actividades`, `m3-grupos`, `m4-reportes`); each test name carries its matrix ID. 23 tests, **all passing in Chrome against the live deploy** (GitHub Pages ↔ Railway) on 2026-09-27. Full-system QA tracking (Cypress + Supertest + manual cases) is issue #27. How to run: README "Tests E2E (Cypress)".

- Config: `E2E_BASE_URL` (frontend, defaults to the local dev server), `E2E_API_URL` (the backend THAT frontend was built against). Credentials in `cypress.env.json` (gitignored; template `cypress.env.example.json`), read with `cy.env()` — Cypress 16 removed `Cypress.env()`; public values go through `expose` / `Cypress.expose()`.
- Data is prepared through the API (`cypress/support/datos.js`) with the accessToken from `/api/auth/refresh`. M3/M4 create their own fresh sección so assertions (best/worst group, CSV rows) are exact on a shared DB. Everything is E2E-prefixed and soft-deleted in `after()`; Módulo 4 report links can't be deleted and stay on the inactive E2E sección.
- **Login rate limit gotcha:** `/api/auth/login` allows 5 attempts per IP per 15 min, *successes included*. `cy.loginAs` caches sessions (`cy.session`, `cacheAcrossSpecs`) and persists the refresh cookie (doesn't rotate, valid 7 days) in `cypress/.sesiones.json` (gitignored), so a full run only spends the 3 logins in `m1-auth`. A 429 fails with an explicit message — wait 15 min.
- **GitHub Pages gotcha:** deep links (`/docente`) are served by the `404.html` SPA fallback with HTTP 404; `cy.visit` is overwritten with `failOnStatusCode: false`.
- Not in Cypress (no frontend screen or not automatable): M2-02/M2-03 (módulos/grados CRUD → Supertest), M1-12, M3-08, M3-10, M4-07, TX-* (manual/Supertest). The matrix's M1-13 still mentions `/estudiante`, which no longer exists.
- Not in CI yet: it needs a live backend and credentials (would be `CYPRESS_*` secrets + a test backend).

### Open decisions (per project planning, unresolved as of last sync)

- ~~Student access model~~ **resolved: one access code per group** (sub-decision confirmed 2026-09-26). See "Módulo 3" above.
- Whether docente accounts (created by admin with a temporary password) require a forced password change on first login.
- Final copy/tone for the student-facing result screen — a first version is implemented in `src/utils/estrellas.js` ("¡Increíble!" / "¡Muy bien!" / "¡Buen intento!"); worth a review with Josue.
- ~~Colab integration~~ **resolved (Módulo 4): manual flow**, only the PDF link is stored.
- Módulo 4 visibility — **resolved for now**: admin reads everything, docente reads/registers only their own; other roles are enabled manually in `src/utils/permisos.js` + the backend. Still open: whether docentes should see each other's reports for a shared sección.
- Módulo 4: who runs the Colab notebook in practice during the pilot — each docente, or centralized (e.g. Antony)?

## Code conventions

- Modern JS (ES2020+), no TypeScript — use JSDoc on props where it helps readability, since there's no compile-time type checking.
- Function components with hooks, no classes. One component per file.
- Frontend form validation is UX only, **never the only security layer** — the backend revalidates everything.
- Every critical flow (login, solving an activity, registering a report) needs at least one automated test before merging to `main` (Vitest for logic, Cypress E2E for the flow).
- Don't assume API changes without confirming with Antony. If an endpoint returns a shape different from what's documented here, this file is stale — flag it so both repos get corrected.
