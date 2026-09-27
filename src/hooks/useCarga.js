import { useCallback, useEffect, useState } from 'react';

// Carga datos de un servicio que devuelve { success, data, error } (el
// contrato de todos los services de src/services). `recargar()` vuelve a
// pedirlos sin duplicar la lógica en cada página.
export default function useCarga(cargar) {
  const [estado, setEstado] = useState({ datos: null, error: null, cargando: true });
  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function ejecutar() {
      const result = await cargar();
      if (cancelado) return;
      setEstado(
        result.success
          ? { datos: result.data, error: null, cargando: false }
          : { datos: null, error: result.error, cargando: false }
      );
    }

    ejecutar();
    return () => {
      cancelado = true;
    };
  }, [cargar, intentos]);

  const recargar = useCallback(() => {
    setEstado((e) => ({ ...e, cargando: true }));
    setIntentos((n) => n + 1);
  }, []);

  return { ...estado, recargar };
}
