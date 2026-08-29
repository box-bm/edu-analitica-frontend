// Datos mock del colegio. Todo lo que se ve en Admin/Docente/Estudiante
// sale de esta misma fuente para que la información se relacione entre roles.

export const PERIODOS = ['Periodo 1', 'Periodo 2', 'Periodo 3'];

export const CURSOS = [
  { id: 'mat', nombre: 'Matemática', docente: 'Prof. Ana Torres', color: '#2563eb' },
  { id: 'idi', nombre: 'Idiomática', docente: 'Prof. Ana Torres', color: '#16a34a' },
  { id: 'cie', nombre: 'Ciencias', docente: 'Prof. Laura Gómez', color: '#f59e0b' },
  { id: 'his', nombre: 'Historia', docente: 'Prof. Carlos Ruiz', color: '#dc2626' },
];

// Cursos que dicta el usuario docente que inicia sesión en la demo.
export const CURSOS_DOCENTE_ACTUAL = ['mat', 'idi'];

export const ESTUDIANTES = [
  { id: 1, nombre: 'Valentina Rojas', grado: '9° A' },
  { id: 2, nombre: 'Mateo Pérez', grado: '9° A' },
  { id: 3, nombre: 'Sofía Ramírez', grado: '9° A' },
  { id: 4, nombre: 'Juan Herrera', grado: '9° B' },
  { id: 5, nombre: 'Isabella Castro', grado: '9° B' },
  { id: 6, nombre: 'Samuel Gómez', grado: '9° B' },
  { id: 7, nombre: 'Camila Ortiz', grado: '9° A' },
  { id: 8, nombre: 'Nicolás Vargas', grado: '9° B' },
];

// notas[estudianteId][cursoId] = [nota periodo1, nota periodo2, nota periodo3]
export const NOTAS = {
  1: { mat: [4.2, 4.5, 4.7], idi: [4.0, 4.3, 4.4], cie: [3.8, 4.0, 4.1], his: [4.5, 4.6, 4.6] },
  2: { mat: [3.0, 2.8, 3.2], idi: [3.5, 3.6, 3.4], cie: [3.2, 3.0, 3.3], his: [3.6, 3.5, 3.7] },
  3: { mat: [4.8, 4.9, 5.0], idi: [4.6, 4.7, 4.8], cie: [4.5, 4.6, 4.7], his: [4.4, 4.5, 4.6] },
  4: { mat: [2.5, 2.9, 3.1], idi: [3.0, 3.2, 3.0], cie: [2.8, 3.0, 3.2], his: [3.1, 3.0, 3.3] },
  5: { mat: [3.8, 3.7, 4.0], idi: [4.1, 4.0, 4.2], cie: [3.9, 4.0, 4.1], his: [3.8, 3.9, 4.0] },
  6: { mat: [2.9, 3.1, 3.0], idi: [2.8, 2.7, 3.0], cie: [3.0, 3.1, 3.0], his: [2.9, 3.0, 3.1] },
  7: { mat: [4.4, 4.3, 4.5], idi: [4.5, 4.6, 4.7], cie: [4.2, 4.3, 4.4], his: [4.3, 4.4, 4.5] },
  8: { mat: [3.3, 3.4, 3.2], idi: [3.2, 3.3, 3.5], cie: [3.4, 3.3, 3.5], his: [3.3, 3.4, 3.4] },
};

// El "estudiante" con el que inicia sesión el usuario Estudiante de la demo.
export const ESTUDIANTE_ACTUAL_ID = 1;

const round1 = (n) => Math.round(n * 10) / 10;
const promedio = (arr) => round1(arr.reduce((a, b) => a + b, 0) / arr.length);

export function promedioEstudianteCurso(estudianteId, cursoId) {
  return promedio(NOTAS[estudianteId][cursoId]);
}

export function promedioEstudianteGeneral(estudianteId) {
  const notas = NOTAS[estudianteId];
  const todas = Object.values(notas).flat();
  return promedio(todas);
}

export function promedioCurso(cursoId, periodoIndex = null) {
  const valores = ESTUDIANTES.map((e) =>
    periodoIndex === null ? promedioEstudianteCurso(e.id, cursoId) : NOTAS[e.id][cursoId][periodoIndex]
  );
  return promedio(valores);
}

export function promedioGeneralColegio() {
  return promedio(ESTUDIANTES.map((e) => promedioEstudianteGeneral(e.id)));
}

export function clasificacion(nota) {
  if (nota >= 4.5) return 'Excelente';
  if (nota >= 4.0) return 'Bueno';
  if (nota >= 3.0) return 'Regular';
  return 'Bajo';
}

export const USUARIOS = [
  { id: 1, nombre: 'Brandon Manzo', usuario: 'admin', rol: 'Admin', estado: 'Activo' },
  { id: 2, nombre: 'Ana Torres', usuario: 'ana.torres', rol: 'Docente', estado: 'Activo' },
  { id: 3, nombre: 'Laura Gómez', usuario: 'laura.gomez', rol: 'Docente', estado: 'Activo' },
  { id: 4, nombre: 'Carlos Ruiz', usuario: 'carlos.ruiz', rol: 'Docente', estado: 'Activo' },
  { id: 5, nombre: 'Valentina Rojas', usuario: 'valentina.rojas', rol: 'Estudiante', estado: 'Activo' },
  { id: 6, nombre: 'Mateo Pérez', usuario: 'mateo.perez', rol: 'Estudiante', estado: 'Activo' },
  { id: 7, nombre: 'Juan Herrera', usuario: 'juan.herrera', rol: 'Estudiante', estado: 'Inactivo' },
];
