import Clasificar from './Clasificar';
import Ordenar from './Ordenar';
import Relacionar from './Relacionar';
import SeleccionImagen from './SeleccionImagen';
import SeleccionMultiple from './SeleccionMultiple';
import { tipoDe } from './tipos';
import './preguntas.css';

const COMPONENTES = {
  MULTIPLE_CHOICE: SeleccionMultiple,
  IMAGE_CHOICE: SeleccionImagen,
  ORDERING: Ordenar,
  MATCHING: Relacionar,
  CLASSIFICATION: Clasificar,
};

// Elige el componente según pregunta.tipo. Todos reciben lo mismo y devuelven
// la respuesta en la forma que espera POST /api/actividades/:id/respuestas.
export default function RenderizadorPregunta({ pregunta, respuesta, onResponder }) {
  const Componente = COMPONENTES[tipoDe(pregunta)];
  return <Componente pregunta={pregunta} respuesta={respuesta} onResponder={onResponder} />;
}
