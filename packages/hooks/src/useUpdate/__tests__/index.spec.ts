import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, test } from 'vitest';

import { useUpdate } from '..';

describe('useUpdate', () => {
  test('should trigger rerender when called', async () => {
    let renders = 0;

    const { result } = renderHook(() => {
      renders += 1;
      return useUpdate();
    });

    expect(renders).toBe(1);

    act(() => {
      result.current();
    });

    expect(renders).toBe(2);
  });

  test('should return a stable function reference across rerenders', () => {
    const { result } = renderHook(() => useUpdate());
    const firstUpdateFn = result.current;

    act(() => result.current());

    expect(result.current).toBe(firstUpdateFn);

    act(() => result.current());

    expect(result.current).toBe(firstUpdateFn);
  });
});
