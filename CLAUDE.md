# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

EduAnalítica is an educational web platform (graduation seminar project, UMG) built for Colegio Mixto Juventud San Francisco. It reinforces basic math and computer skills for 1st–3rd grade students through interactive activities, with performance analysis backed by Python/Colab on the side.

This repo is the **frontend**. It's meant to consume the `edu-analitica-backend` REST API (Express + TypeORM, sibling repo `../edu-analitica-backend`). Both repos should stay aligned on the API contract — see "Backend API contract" below.

Team: Jose (frontend, owner of this repo) · Antony (backend) · María José (QA) · Brandon (architect) · Josue (PO).

**Current staffing note (as of 2026-09-18):** Jose is on vacation, back the week of 2026-09-21. Brandon (architect) is covering the frontend seat this week, working in parallel with Antony on backend, to keep the Módulo 2 auth/Secciones slice moving. See "Auth: real bug found" below for the active work item.

### Environment & UX constraints (drive real UI decisions)

- Runs on **Windows 10** with a modern browser (Edge/Chrome) on the school's computers. No Windows 7/XP support needed, so modern JS/CSS is fine without heavy polyfills.
- The `estudiante` role is used by **children aged 7–10**. That section's UI must stay simple and visual with minimal text, large buttons, and no wording that reads as failure (avoid "Reprobaste", red/negative tone, etc. — use a neutral, motivational framing instead).

## Commands

```bash
npm run dev       # start Vite dev server (http://localhost:5173/edu-analitica-frontend/)
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # eslint .
```

There is no test runner configured in this project (no Cypress or other E2E runner is set up, despite being called for in earlier planning docs — see below).

## Architecture (current implementation)

React 19 + Vite SPA (`login-react` in package.json), plain JavaScript (`.jsx`, not TypeScript) with plain CSS (no Tailwind). Deployed to GitHub Pages at the `/edu-analitica-frontend/` subpath — `vite.config.js` sets `base` accordingly and `App.jsx` passes `basename={import.meta.env.BASE_URL}` to the router, so both must stay in sync with the repo name.

Roles on the backend are stored lowercase (`administrador`, `docente`, `estudiante`); the frontend uses capitalized role strings (`Admin`, `Docente`, `Estudiante`) — this mapping happens on the backend response, not in this repo.

### Auth: real bug found — accessToken is never attached to requests

`src/services/userService.jsx` no longer uses mocks (the old `MOCK_USERS` array is left commented out for reference, not deleted). It calls the real backend through `apiClient`: `login`, `refresh`, `logout`, `me` all hit `edu-analitica-backend` (`POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/usuarios/me`). `src/services/apiClient.jsx` is an axios instance with `baseURL` from `VITE_API_URL` and `withCredentials: true` so the httpOnly refresh cookie survives the cross-domain request to Railway.

**Validated end-to-end against the live deploy (2026-09-18, `box-bm.github.io/edu-analitica-frontend/` ↔ Railway):**
- ✅ **Login works** — real credentials against the real backend, redirects to the correct role dashboard.
- ✅ **Logout works** — `POST /api/auth/logout` returns 204 and actually revokes the session server-side (confirmed a subsequent `/api/auth/refresh` with the same cookie then returns 401).
- ❌ **Reload does NOT work** — reloading an authenticated route (e.g. `/admin`) kicks the user back to login even though the backend session is still valid.

**Root cause (confirmed via curl directly against the Railway backend, isolating frontend vs. backend):** the backend is fine — `POST /api/auth/login` and `POST /api/auth/refresh` both return `{accessToken}`, and `GET /api/usuarios/me` returns 200 when called with `Authorization: Bearer <that token>`. The bug is that **`AuthContext.jsx` never stores the `accessToken` anywhere, and `apiClient.jsx` has no request interceptor that attaches `Authorization: Bearer <accessToken>`** (`grep -rn "Authorization\|Bearer" src/` only matches comments, no actual header-setting code). So on `restoreSession()` (mount/reload), `refresh()` succeeds and gets a fresh token that's immediately discarded, then `me()` goes out with no `Authorization` header → 401 → `user` stays `null` → `PrivateRoute` redirects to `/`.

**This is the active fix — do this first:**
1. Store the `accessToken` somewhere `apiClient` can read it on every request — in-memory only, per the security requirement below (never `localStorage`). A module-level variable in `apiClient.jsx` with a setter, or the token kept in `AuthContext` state and pushed into `apiClient` via a setter function, both work; just keep it out of `localStorage`.
2. Add a request interceptor in `apiClient.jsx` (`apiClient.interceptors.request.use(...)`) that adds `Authorization: Bearer <token>` when a token is set.
3. Set the token after a successful `login()` and after a successful `refresh()` in `AuthContext.jsx`; clear it on `logout()`.
4. Re-test the login → reload → logout loop against the live deploy after the fix — that's the actual acceptance check, not just that it compiles.

**Minor, not blocking:** field-shape mismatch between `POST /api/auth/login`'s `usuario: {id, nombre, rol}` (flat string `rol`) and `GET /api/usuarios/me`'s `{nombreCompleto, usuario, rol: {id, nombreRol}}` — already handled correctly by manual mapping in both places in `AuthContext.jsx`, but worth aligning with Antony later so this class of bug doesn't recur.

Once the fix is confirmed working, delete the commented-out `MOCK_USERS` block in `userService.jsx` instead of leaving it as dead code. Note: `hasPermission` in `AuthContext.jsx` references role names (`Alumno`, `Catedratico`) that don't match the actual roles used elsewhere (`Estudiante`, `Docente`, `Admin`) and isn't called anywhere — treat it as stale/unused.

### Routing and role gating

`App.jsx` defines all routes and wraps role-specific ones in `PrivateRoute` (`src/routes/PrivateRoute.jsx`), which redirects to `/` if not authenticated or `/no-autorizado` if the role doesn't match. The root route `/` renders `Login` unless already authenticated, in which case it redirects by role. Role → route mapping (`Estudiante → /estudiante`, `Docente → /docente`, `Admin → /admin`) is duplicated in both `login.jsx` (`redirigirPorRol`) and `App.jsx` (`RutaInicio`) — update both if roles or routes change.

Even once real auth lands, the backend must be treated as the source of truth for authorization — the frontend role check (hiding a route/button) is UX only, never a security boundary.

### Dashboard pattern (admin/docente/estudiante)

Each role has a thin top-level page (`src/pages/admin.jsx`, `docente.jsx`, `estudiante.jsx`) that builds a `menuItems` array of `{ label, icon, content }` and renders `<DashboardLayout menuItems={...} />`. `DashboardLayout` (`src/components/DashboardLayout.jsx`) owns the sidebar/topbar chrome and just renders the `content` of whichever item is selected — it has no knowledge of what each section contains. Section content itself lives in per-role subfolders (`src/pages/admin/*`, `src/pages/docente/*`, `src/pages/estudiante/*`), one component per menu item.

Shared dashboard UI pieces (`StatCard`, `Badge`, and `widgets.css` with `.panel`, `.kpi-grid`, `.data-table`, `.dashboard-form`, etc.) live in `src/components/dashboard/` and are reused across all three roles' sections.

### Mock data layer

All dashboard content (KPIs, tables, charts) is currently backed by a single mock dataset in `src/data/mockData.js` — courses, students, and a `NOTAS` grade matrix (`NOTAS[estudianteId][cursoId] = [nota periodo1, nota periodo2, nota periodo3]`), plus derived helpers (`promedioEstudianteCurso`, `promedioCurso`, `promedioGeneralColegio`, `clasificacion`, etc.). The data is intentionally shared/cross-referenced across roles: `CURSOS_DOCENTE_ACTUAL` and `ESTUDIANTE_ACTUAL_ID` hardcode which courses/student the logged-in demo docente/estudiante "owns", independent of who actually logged in (login only determines the *role*, not which mock entity is shown). When replacing mocks with real API data, these constants and helper functions are the integration points.

Charts use `recharts` (bar, line, pie, radar) inside `ResponsiveContainer`; they animate in on mount, so a chart appearing empty in a screenshot taken immediately after navigation is very likely mid-animation, not broken.

### Layout gotcha

`DashboardLayout`'s content area (`main.dashboard-content`) is a flex child and needs `min-width: 0` (already set) for wide tables to scroll inside `.panel`'s `overflow-x: auto` instead of overflowing the page — keep this in mind if the flex layout is restructured.

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
GET/POST/PUT/DELETE  /api/secciones?id_grado=   implemented on backend, admin-only — not yet consumed here, see "Secciones" below
GET                  /api/admin/resumen

GET/POST/PUT  /api/actividades
POST          /api/actividades/:id/preguntas   max 10 questions — disable "+ Agregar pregunta" at the limit client-side, but the backend also enforces it
GET           /api/docentes/me/resultados?grado=&modulo=
GET           /api/reportes?grado=&modulo=
GET           /api/reportes/:id/export
GET           /api/reportes/:id/pdf
GET           /api/usuarios/me   planned — see "Real integration" below, not implemented yet
```

### Secciones (backend ready, frontend page not built yet)

Módulo 2 (ampliado) adds a `secciones` concept alongside `grados`, so the school can organize students into real groups (e.g. "1ro A", "1ro B") instead of just a grade level. `secciones` relates 1-to-many to `grados` (`id_grado` FK, unique on `id_grado + nombre_seccion`, soft-deleted via `activa`). Once the student/group model is defined (still blocked on Josue), it will hang off `secciones`, not `grados` directly.

**Backend is done**: `GET/POST /api/grados` and `GET/POST/PUT/DELETE /api/secciones?id_grado=` are implemented, admin-only, with duplicate validation and soft-delete (see `edu-analitica-backend` CLAUDE.md "Current entregable"). Nothing on the frontend consumes them yet — this is the next concrete piece of work here:

- New Admin-only page, `Secciones` (a table + create/edit modal with a Grado select), added as a tab in the admin dashboard next to Usuarios/Módulos/Grados — follow the same `src/pages/admin/*` + `menuItems` pattern described above (see `src/pages/admin/UsuariosAdmin.jsx` for the closest existing table+modal example to copy from).
- Will need a `gradosService`/`seccionesService` (or extend an existing service file) wrapping `apiClient` calls to the two endpoints above.
- Grado select in the create/edit modal should be populated from `GET /api/grados`.

### Real integration: auth against the live backend (cross-domain infra confirmed good)

The Módulo 1 auth flow — login, refresh, logout, protected routes, and `usuarios/me` — is wired to Antony's deployed backend (Railway) instead of `MOCK_USERS`. The cross-domain plumbing this needed (frontend on GitHub Pages, backend on Railway, different domains) is confirmed working end-to-end via direct testing against production:

- `apiClient`'s `baseURL` comes from `VITE_API_URL`, `withCredentials: true` is set, and the backend's refresh cookie (`sameSite=none; secure=true` in production) is correctly sent/received cross-domain — verified: login sets the cookie, refresh reads it and returns a valid new token, logout revokes it server-side.
- CORS is correctly scoped (`Access-Control-Allow-Credentials: true`, `Access-Control-Allow-Origin` matching this deploy's exact GitHub Pages origin) — confirmed via response headers.
- Infra is live end-to-end: Neon Postgres + Railway deploy on the backend (test users, roles, and `grados`/`secciones` data already seeded), GitHub Pages on this repo.

**The only remaining gap is the frontend-side bug described in "Auth: real bug found" above** — the backend/cross-domain layer is not the problem; `accessToken` handling in this repo is. Once that's fixed, re-run login → reload → logout against the live deploy as the acceptance check.

This round of integration is scoped to auth + Secciones only — the rest of the Módulo 2 backend surface (`actividades`, `reportes`) stays out of scope for now, and the student/group model stays fully blocked on Josue's decision.

### Planned testing setup (not started)

No test tooling exists in this repo yet (see "Commands" above). When QA setup lands, the plan is:

- Install Cypress in this repo; `cypress.config.ts` with a configurable `baseUrl` (local vs. the real deploy) — note this implies a `.ts` config file even though the rest of the app is `.jsx`, since Cypress config is commonly TypeScript regardless of app language.
- First real spec: `cypress/e2e/auth.cy.ts` covering login → role landing → logout against the real integrated backend.
- A fixed test user (e.g. `admin.test`) seeded in the backend's dedicated testing DB branch, so tests don't depend on real school data.
- Document how to run tests in `TESTING.md` (or a section here) so the whole team can run them, not just QA.

### Open decisions (per project planning, unresolved as of last sync)

- Student access model (individual login vs. group/shared access) — blocked on Josue; affects the estudiante login/identification flow and the data shape for a `Resultado` result screen, and downstream affects how `secciones` eventually links to students.
- Whether docente accounts (created by admin with a temporary password) require a forced password change on first login.
- Final copy/tone for the student-facing result screen — needs to fit the "no failure-sounding messaging" constraint above.
