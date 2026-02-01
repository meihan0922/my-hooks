import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, test } from 'vitest';

import { useSetState } from '..';

describe('useMount', () => {
  test('should merge object patch', async () => {
    const { result } = renderHook(() => useSetState({ a: 1, b: 10 }));

    expect(result.current[0]).toEqual({ a: 1, b: 10 });

    act(() => {
      const [, setState] = result.current;
      setState({ a: 2 });
    });

    expect(result.current[0]).toEqual({ a: 2, b: 10 });
  });

  test('should merge functional patch', async () => {
    const { result } = renderHook(() => useSetState({ a: 1, b: 10 }));
    act(() => {
      const [, setState] = result.current;
      setState(() => ({ a: 2 }));
    });

    expect(result.current[0]).toEqual({ a: 2, b: 10 });
  });

  test('should apply multiple functional patches correctly', async () => {
    const { result } = renderHook(() => useSetState({ a: 1 }));
    act(() => {
      const [, setState] = result.current;
      setState(prev => ({ a: prev.a + 1 }));
      setState(prev => ({ a: prev.a + 1 }));
      setState(prev => ({ a: prev.a + 1 }));
    });

    expect(result.current[0]).toEqual({ a: 4 });
  });
  test('should keep stable setState reference across rerenders', async () => {
    const { result } = renderHook(() => useSetState({ a: 1 }));

    const firstSetter = result.current[1];

    act(() => {
      const [, setState] = result.current;
      setState({ a: 2 });
    });

    expect(result.current[1]).toBe(firstSetter);
  });
  test('should support lazy initialState initializer', async () => {
    const { result } = renderHook(() =>
      useSetState(() => ({
        a: 1,
      })),
    );

    expect(result.current[0]).toEqual({
      a: 1,
    });
  });
});
