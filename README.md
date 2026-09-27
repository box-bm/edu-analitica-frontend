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

Requiere Node `>=22.22.2`.

## Cómo se usa

- **Docentes y administración** entran con usuario y contraseña en `/`.
  - **Docente:** crea grupos por sección (cada uno recibe un código de 6 caracteres), revisa su avance y resultados, y crea actividades propias o usa las del catálogo base.
  - **Administración:** gestiona usuarios y secciones.
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
├── utils/                  # Cálculo de estrellas y mensajes
└── data/mockData.js        # Datos de ejemplo de los tableros que aún no tienen endpoint
```

## Seguridad

- El `accessToken` y el token de grupo viven solo en memoria, nunca en `localStorage`.
- El refresh token es una cookie `httpOnly` que gestiona el backend.
- Ocultar botones o rutas en el frontend es solo UX: el backend valida rol y alcance en cada petición.

## CI / Deploy

- `ci.yml` corre lint y tests en cada PR hacia `main`.
- `deploy.yml` corre los tests y publica en GitHub Pages en cada push a `main`. Usa el secret `VITE_API_URL`.
