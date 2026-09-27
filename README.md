# EduAnalítica — Frontend

Frontend del proyecto de seminario **EduAnalítica** (UMG) para el Colegio Mixto Juventud San Francisco: refuerzo de matemática y computación para 1ro–3ro primaria mediante actividades interactivas.

Consume la API REST de [`edu-analitica-backend`](../edu-analitica-backend) y se publica en GitHub Pages bajo `/edu-analitica-frontend/`.

## Stack

- **React 19** + **Vite** (JavaScript, con React Compiler)
- **react-router-dom** para rutas, **axios** para la API, **recharts** para gráficas
- CSS plano con tokens de diseño en `src/index.css` (sin frameworks de estilos)
- **Vitest** + **React Testing Library**

## Puesta en marcha

```bash
npm install
echo "VITE_API_URL=http://localhost:3000" > .env   # URL del backend
npm run dev                                          # http://localhost:5173/edu-analitica-frontend/
```

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Build de producción en `dist/`. |
| `npm run preview` | Sirve el build localmente. |
| `npm run lint` | ESLint. |
| `npm test` | Tests (sin red ni backend). |
| `npm run e2e` | Tests E2E con Cypress contra el sistema real (ver abajo). |
| `npm run e2e:open` | Lo mismo, con la interfaz de Cypress. |

Requiere Node `>=22.22.2`.

## Tests E2E (Cypress)

Recorren la app real (frontend + backend + base de datos) siguiendo la matriz de pruebas del proyecto: un spec por módulo en `cypress/e2e/` (`m1-auth`, `m2-admin`, `m2-actividades`, `m3-grupos`, `m4-reportes`). Cada test indica en su nombre el ID de la matriz (M1-01, M3-06…).

1. Copia `cypress.env.example.json` a `cypress.env.json` (está en `.gitignore`) y pon un usuario admin y uno docente reales. Conviene un docente dedicado a pruebas: los tests crean grupos y resultados con él.
2. Elige contra qué correr:

```bash
# Contra el deploy (GitHub Pages + Railway)
E2E_BASE_URL=https://box-bm.github.io/edu-analitica-frontend/ \
E2E_API_URL=https://edu-analitica-backend-production.up.railway.app \
npm run e2e

# Contra local: primero `npm run dev` con VITE_API_URL apuntando al backend local
E2E_API_URL=http://localhost:3000 npm run e2e
```

- Los datos que crean los tests llevan el prefijo **E2E** y se desactivan al terminar cada spec (soft delete). Los links de reportes de Módulo 4 no se pueden borrar: quedan en una sección E2E inactiva.
- El backend permite **5 logins por IP cada 15 minutos**. Los tests reutilizan la sesión de admin y docente (la cookie de refresh se guarda en `cypress/.sesiones.json`, ignorado por git), así que una corrida gasta 3 logins (los de las pruebas de login en `m1-auth`). Si sale un 429, espera 15 minutos.
- El grado que usan los tests necesita al menos dos módulos con actividades del catálogo (`npm run seed:actividades` en el backend).

## Cómo se usa

- **Docentes y administración** entran con usuario y contraseña en `/`.
  - **Docente:** crea grupos por sección (cada uno recibe un código de 6 caracteres), revisa su avance, resultados y reportes, y crea actividades propias o usa las del catálogo base.
  - **Administración:** gestiona usuarios y secciones, y ve el resumen y los reportes de todo el colegio (con exportación CSV para Colab).
- **Estudiantes** trabajan en grupo: desde “¿Eres estudiante?” el coordinador escribe el código del grupo en `/grupo`, elige un módulo, resuelve la actividad pregunta a pregunta y ve su resultado con estrellas. La sesión de grupo dura 45 minutos y vive solo en memoria.

## Estructura

```
src/
├── App.jsx                 # Rutas
├── context/                # AuthContext (docente/admin) y GrupoContext (sesión de grupo)
├── services/               # Clientes axios y un servicio por recurso de la API
├── routes/                 # PrivateRoute (por rol) y GrupoRoute (sesión de grupo)
├── components/             # DashboardLayout, GrupoLayout, Estrellas y widgets compartidos
├── pages/
│   ├── admin/ · docente/   # Secciones de cada panel
│   └── estudiante/         # Zona de grupos: acceso, módulos, actividad, resultado
├── hooks/useCarga.js       # Carga de datos con estado de carga/error/reintento
├── components/reportes/    # Gráficas y tablas de reportes (admin y docente)
└── utils/                  # Cálculo de estrellas y mensajes
```

## Seguridad

- El `accessToken` y el token de grupo viven solo en memoria, nunca en `localStorage`.
- El refresh token es una cookie `httpOnly` que gestiona el backend.
- Ocultar botones o rutas en el frontend es solo UX: el backend valida rol y alcance en cada petición.

Todos los datos vienen de la API; no hay datos de ejemplo en el frontend.

## CI / Deploy

- `ci.yml` corre lint y tests en cada PR hacia `main`.
- `deploy.yml` corre los tests y publica en GitHub Pages en cada push a `main`. Usa el secret `VITE_API_URL`.
