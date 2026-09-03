# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

EduAnalítica is an educational web platform (graduation seminar project, UMG) built for Colegio Mixto Juventud San Francisco. It reinforces basic math and computer skills for 1st–3rd grade students through interactive activities, with performance analysis backed by Python/Colab on the side.

This repo is the **frontend**. It's meant to consume the `edu-analitica-backend` REST API (Express + TypeORM, sibling repo `../edu-analitica-backend`). Both repos should stay aligned on the API contract — see "Backend API contract" below.

Team: Jose (frontend, owner of this repo) · Antony (backend) · María José (QA) · Brandon (architect) · Josue (PO).

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

### Auth is currently fully mocked

`src/services/userService.jsx` does **not** call the backend — it checks credentials against a hardcoded `MOCK_USERS` array (`estudiante`/`docente`/`admin`, all password `1234`) with an artificial delay. `src/services/apiClient.jsx` (axios instance pointed at `http://localhost:3001`) exists but is unused by `userService`. When wiring up real auth, `userService.login` is the place to swap the mock for a real `apiClient` call — keep the return shape (`{ success, data: { user } }` / `{ success: false, error }`) since `AuthContext.login` depends on it.

`AuthContext` (`src/context/AuthContext.jsx`) persists the logged-in user to `localStorage` under `edua-user` and exposes `login`, `logout`, `hasRole`, `isAuthenticated`. Note: `hasPermission` in the same file references role names (`Alumno`, `Catedratico`) that don't match the actual roles used elsewhere (`Estudiante`, `Docente`, `Admin`) and isn't called anywhere — treat it as stale/unused rather than a source of truth for permissions.

**Session storage note:** current code persists the full user object to `localStorage`. Earlier project planning called for keeping `accessToken` in memory only (React context, never `localStorage`) with a `refreshToken` in an httpOnly cookie, to avoid XSS exposure — see "Real auth model (planned, not implemented)" below. Keep that in mind when real auth gets wired up; it's a deliberate security requirement from the project spec, not just a style preference.

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
GET/POST             /api/grados
GET/POST/PUT/DELETE  /api/secciones?id_grado=   planned — see "Secciones" below, not implemented yet
GET                  /api/admin/resumen

GET/POST/PUT  /api/actividades
POST          /api/actividades/:id/preguntas   max 10 questions — disable "+ Agregar pregunta" at the limit client-side, but the backend also enforces it
GET           /api/docentes/me/resultados?grado=&modulo=
GET           /api/reportes?grado=&modulo=
GET           /api/reportes/:id/export
GET           /api/reportes/:id/pdf
GET           /api/usuarios/me   planned — see "Real integration" below, not implemented yet
```

### Secciones (planned, not implemented)

Módulo 2 (ampliado) adds a `secciones` concept alongside `grados`, so the school can organize students into real groups (e.g. "1ro A", "1ro B") instead of just a grade level. `secciones` relates 1-to-many to `grados` (`id_grado` FK, unique on `id_grado + nombre_seccion`, soft-deleted via `activa`). Once the student/group model is defined (still blocked on Josue), it will hang off `secciones`, not `grados` directly.

On the frontend this means a new Admin-only page, `Secciones` (a table + create/edit modal with a Grado select), added as a tab in the admin dashboard next to Usuarios/Módulos/Grados — following the same `src/pages/admin/*` + `menuItems` pattern described above, backed by `GET/POST/PUT/DELETE /api/secciones?id_grado=`. None of this exists in the codebase yet.

### Real integration: auth against the live backend (planned, not implemented)

The first real (non-mock) integration point is the Módulo 1 auth flow — login, refresh, logout, protected routes, and `usuarios/me` — connecting `userService`/`apiClient` to Antony's deployed backend instead of `MOCK_USERS`. This is scoped narrower than the full "Real auth model" described above: it's specifically about making that model work once frontend and backend are deployed on **different domains** (frontend on GitHub Pages/Vercel/Netlify, backend on Railway), which the original Módulo 1 design didn't account for. Concretely, when this gets built:

- `apiClient`'s `API_BASE_URL` needs to come from an env var (e.g. `VITE_API_URL`) pointing at the deployed backend, not hardcoded to `http://localhost:3001`.
- Every request that relies on the refresh cookie needs `withCredentials: true` on the axios client (or `credentials: 'include'` for `fetch`) — without it, the httpOnly refresh cookie never gets sent or set cross-domain.
- The backend's refresh cookie needs `sameSite=none; secure=true` and its CORS `FRONTEND_URL` must be the exact deployed frontend origin (not `*`) for the cookie to survive a cross-domain request at all.
- **If session doesn't persist across a page reload after login, suspect this cross-domain cookie config first** (`withCredentials`/`credentials`, `sameSite`, or backend CORS) before assuming it's a frontend bug — coordinate with Antony rather than debugging it solo.
- Flow to validate once wired up: login → reload the page (session recovers via `/api/auth/refresh`) → logout (a subsequent refresh should actually fail, i.e. the session was revoked server-side, not just cleared from local state).
- Landing pages should show the real `nombre_completo` from `GET /api/usuarios/me` instead of relying only on what's baked into the JWT.

This round of integration is scoped to auth + Secciones only — the rest of the Módulo 2 backend surface (`actividades`, `reportes`) stays mocked for now, and the student/group model stays fully blocked on Josue's decision.

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
