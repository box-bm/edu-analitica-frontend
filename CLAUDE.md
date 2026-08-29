# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server (http://localhost:5173/edu-analitica-frontend/)
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # eslint .
```

There is no test runner configured in this project.

## Architecture

React 19 + Vite SPA (`login-react` in package.json) for a school analytics platform ("EducAnalítica"). Deployed to GitHub Pages at the `/edu-analitica-frontend/` subpath — `vite.config.js` sets `base` accordingly and `App.jsx` passes `basename={import.meta.env.BASE_URL}` to the router, so both must stay in sync with the repo name.

Companion backend lives in the sibling repo `../edu-analitica-backend` (Express + TypeORM). Roles there are stored lowercase (`administrador`, `docente`, `estudiante`); the frontend uses capitalized role strings (`Admin`, `Docente`, `Estudiante`) — this mapping happens on the backend response, not in this repo.

### Auth is currently fully mocked

`src/services/userService.jsx` does **not** call the backend — it checks credentials against a hardcoded `MOCK_USERS` array (`estudiante`/`docente`/`admin`, all password `1234`) with an artificial delay. `src/services/apiClient.jsx` (axios instance pointed at `http://localhost:3001`) exists but is unused by `userService`. When wiring up real auth, `userService.login` is the place to swap the mock for a real `apiClient` call — keep the return shape (`{ success, data: { user } }` / `{ success: false, error }`) since `AuthContext.login` depends on it.

`AuthContext` (`src/context/AuthContext.jsx`) persists the logged-in user to `localStorage` under `edua-user` and exposes `login`, `logout`, `hasRole`, `isAuthenticated`. Note: `hasPermission` in the same file references role names (`Alumno`, `Catedratico`) that don't match the actual roles used elsewhere (`Estudiante`, `Docente`, `Admin`) and isn't called anywhere — treat it as stale/unused rather than a source of truth for permissions.

### Routing and role gating

`App.jsx` defines all routes and wraps role-specific ones in `PrivateRoute` (`src/routes/PrivateRoute.jsx`), which redirects to `/` if not authenticated or `/no-autorizado` if the role doesn't match. The root route `/` renders `Login` unless already authenticated, in which case it redirects by role. Role → route mapping (`Estudiante → /estudiante`, `Docente → /docente`, `Admin → /admin`) is duplicated in both `login.jsx` (`redirigirPorRol`) and `App.jsx` (`RutaInicio`) — update both if roles or routes change.

### Dashboard pattern (admin/docente/estudiante)

Each role has a thin top-level page (`src/pages/admin.jsx`, `docente.jsx`, `estudiante.jsx`) that builds a `menuItems` array of `{ label, icon, content }` and renders `<DashboardLayout menuItems={...} />`. `DashboardLayout` (`src/components/DashboardLayout.jsx`) owns the sidebar/topbar chrome and just renders the `content` of whichever item is selected — it has no knowledge of what each section contains. Section content itself lives in per-role subfolders (`src/pages/admin/*`, `src/pages/docente/*`, `src/pages/estudiante/*`), one component per menu item.

Shared dashboard UI pieces (`StatCard`, `Badge`, and `widgets.css` with `.panel`, `.kpi-grid`, `.data-table`, `.dashboard-form`, etc.) live in `src/components/dashboard/` and are reused across all three roles' sections.

### Mock data layer

All dashboard content (KPIs, tables, charts) is currently backed by a single mock dataset in `src/data/mockData.js` — courses, students, and a `NOTAS` grade matrix (`NOTAS[estudianteId][cursoId] = [nota periodo1, nota periodo2, nota periodo3]`), plus derived helpers (`promedioEstudianteCurso`, `promedioCurso`, `promedioGeneralColegio`, `clasificacion`, etc.). The data is intentionally shared/cross-referenced across roles: `CURSOS_DOCENTE_ACTUAL` and `ESTUDIANTE_ACTUAL_ID` hardcode which courses/student the logged-in demo docente/estudiante "owns", independent of who actually logged in (login only determines the *role*, not which mock entity is shown). When replacing mocks with real API data, these constants and helper functions are the integration points.

Charts use `recharts` (bar, line, pie, radar) inside `ResponsiveContainer`; they animate in on mount, so a chart appearing empty in a screenshot taken immediately after navigation is very likely mid-animation, not broken.

### Layout gotcha

`DashboardLayout`'s content area (`main.dashboard-content`) is a flex child and needs `min-width: 0` (already set) for wide tables to scroll inside `.panel`'s `overflow-x: auto` instead of overflowing the page — keep this in mind if the flex layout is restructured.
