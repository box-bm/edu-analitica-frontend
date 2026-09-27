import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useCarga from '../src/hooks/useCarga';

describe('useCarga', () => {
  it('exposes data on success', async () => {
    const cargar = vi.fn().mockResolvedValue({ success: true, data: [1, 2] });
    const { result } = renderHook(() => useCarga(cargar));
    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.datos).toEqual([1, 2]));
    expect(result.current.error).toBeNull();
  });

  it('exposes the error message on failure', async () => {
    const cargar = vi.fn().mockResolvedValue({ success: false, error: 'falló' });
    const { result } = renderHook(() => useCarga(cargar));
    await waitFor(() => expect(result.current.error).toBe('falló'));
    expect(result.current.datos).toBeNull();
  });

  it('reloads on demand', async () => {
    const cargar = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: 'a' })
      .mockResolvedValueOnce({ success: true, data: 'b' });
    const { result } = renderHook(() => useCarga(cargar));
    await waitFor(() => expect(result.current.datos).toBe('a'));

    act(() => result.current.recargar());

    await waitFor(() => expect(result.current.datos).toBe('b'));
    expect(cargar).toHaveBeenCalledTimes(2);
  });
});
