import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SeccionesAdmin from '../src/pages/admin/SeccionesAdmin';
import seccionesService from '../src/services/seccionesService';

vi.mock('../src/services/seccionesService', async (importOriginal) => ({
  ...(await importOriginal()),
  default: {
    listarGrados: vi.fn(),
    listarSecciones: vi.fn(),
    crearGrado: vi.fn(),
    actualizarGrado: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  },
}));

const ESTE_ANIO = new Date().getFullYear();

// Llegan desordenados a propósito: la página ordena por `orden`.
const grados = [
  { id: 2, nombreGrado: '2do', orden: 2, activo: true },
  { id: 1, nombreGrado: '1ro', orden: 1, activo: true },
  { id: 3, nombreGrado: 'Preparatoria', orden: 0, activo: false },
];

const secciones = [
  { id: 10, idGrado: 1, nombreSeccion: 'A', ciclo: ESTE_ANIO, activa: true, grado: { id: 1, nombreGrado: '1ro' } },
  { id: 11, idGrado: 1, nombreSeccion: 'Z', ciclo: ESTE_ANIO - 1, activa: true, grado: { id: 1, nombreGrado: '1ro' } },
];

const tablas = () => screen.getAllByRole('table');
const tablaGrados = () => tablas()[0];
const tablaSecciones = () => tablas()[1];

async function renderizar() {
  render(<SeccionesAdmin />);
  await screen.findByText('Grados');
}

describe('SeccionesAdmin: grados y ciclo escolar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seccionesService.listarGrados.mockResolvedValue({ success: true, data: grados });
    seccionesService.listarSecciones.mockResolvedValue({ success: true, data: secciones });
  });

  it('lists grados by orden', async () => {
    await renderizar();
    const nombres = within(tablaGrados())
      .getAllByRole('row')
      .slice(1)
      .map((fila) => within(fila).getAllByRole('cell')[1].textContent);
    expect(nombres).toEqual(['Preparatoria', '1ro', '2do']);
  });

  it("shows only the current ciclo's secciones by default", async () => {
    await renderizar();
    expect(within(tablaSecciones()).getByText('A')).toBeInTheDocument();
    expect(within(tablaSecciones()).queryByText('Z')).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por ciclo escolar'), 'Todos');
    expect(within(tablaSecciones()).getByText('Z')).toBeInTheDocument();
  });

  it('creates a grado with the next orden', async () => {
    seccionesService.crearGrado.mockResolvedValueOnce({
      success: true,
      data: { id: 4, nombreGrado: '3ro', orden: 3, activo: true },
    });
    await renderizar();

    await userEvent.click(screen.getByRole('button', { name: '+ Nuevo grado' }));
    expect(screen.getByLabelText('Orden en las listas')).toHaveValue(3);
    await userEvent.type(screen.getByLabelText('Nombre del grado'), '3ro');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(seccionesService.crearGrado).toHaveBeenCalledWith({ nombreGrado: '3ro', orden: 3 });
    expect(await within(tablaGrados()).findByText('3ro')).toBeInTheDocument();
  });

  it('deactivates a grado through the API', async () => {
    seccionesService.actualizarGrado.mockResolvedValueOnce({
      success: true,
      data: { ...grados[0], activo: false },
    });
    await renderizar();

    const fila = within(tablaGrados()).getByText('2do').closest('tr');
    await userEvent.click(within(fila).getByRole('button', { name: 'Desactivar' }));

    expect(seccionesService.actualizarGrado).toHaveBeenCalledWith(2, { activo: false });
    expect(within(fila).getByText('Inactivo')).toBeInTheDocument();
  });

  it('creates a sección in the chosen ciclo, offering only active grados', async () => {
    seccionesService.crear.mockResolvedValueOnce({
      success: true,
      data: { id: 12, idGrado: 2, nombreSeccion: 'B', ciclo: ESTE_ANIO + 1, activa: true, grado: { id: 2, nombreGrado: '2do' } },
    });
    await renderizar();

    await userEvent.click(screen.getByRole('button', { name: '+ Nueva sección' }));
    const dialogo = screen.getByRole('dialog');
    const selectGrado = within(dialogo).getByLabelText('Grado');
    expect(within(selectGrado).queryByText('Preparatoria')).not.toBeInTheDocument();
    expect(within(dialogo).getByLabelText('Ciclo escolar')).toHaveValue(ESTE_ANIO);

    await userEvent.selectOptions(selectGrado, '2');
    const ciclo = within(dialogo).getByLabelText('Ciclo escolar');
    await userEvent.clear(ciclo);
    await userEvent.type(ciclo, String(ESTE_ANIO + 1));
    await userEvent.type(within(dialogo).getByLabelText('Nombre de la sección'), 'B');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar' }));

    expect(seccionesService.crear).toHaveBeenCalledWith({ idGrado: 2, nombreSeccion: 'B', ciclo: ESTE_ANIO + 1 });
  });
});
