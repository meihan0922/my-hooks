import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { useLockFn } from '..';

describe('useMount', () => {
  test('should only execute once while promise is pending', async () => {
    let resolveFn: ((value?: unknown) => void) | null = null;

    const fn = vi.fn(
      (p: string) =>
        new Promise(resolve => {
          resolveFn = resolve;
          return Promise.resolve(p);
        }),
    );

    const { result } = renderHook(() => useLockFn(fn));

    act(() => {
      result.current('A');
      result.current('B');
      result.current('C');
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('A');

    await act(async () => {
      resolveFn?.();
    });
  });
  test('should allow next call after previous promise resolves', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    const { result } = renderHook(() => useLockFn(fn));

    await act(async () => {
      await result.current('A');
    });

    await act(async () => {
      await result.current('B');
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'A');
    expect(fn).toHaveBeenNthCalledWith(2, 'B');
  });
  test('should unlock after promise rejects', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('ok');

    const { result } = renderHook(() => useLockFn(fn));

    await act(async () => {
      try {
        await result.current('A');
      } catch {
        // ignore
      }
    });

    await act(async () => {
      await result.current('B');
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'A');
    expect(fn).toHaveBeenNthCalledWith(2, 'B');
  });
  test('should return stable function reference across rerenders', () => {
    const fn = vi.fn().mockResolvedValue('ok');

    const { result, rerender } = renderHook(() => useLockFn(fn));

    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
