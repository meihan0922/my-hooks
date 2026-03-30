import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { StrictMode, useState } from 'react';
import { describe, expect, test } from 'vitest';

import { useMemoizedFn } from '..';

describe('useMemoizedFn', () => {
  test('should return a stable function reference across renders', async () => {
    const { result, rerender } = renderHook(() => {
      const [count, setCount] = useState(0);
      const increment = useMemoizedFn(() => setCount(count + 1));
      return { setCount, increment };
    });
    const firstIncrement = result.current.increment;
    act(() => {
      result.current.setCount(1);
    });

    rerender();

    const secondIncrement = result.current.increment;
    expect(secondIncrement).toBe(firstIncrement);
  });

  test('should always use the latest state/props', async () => {
    const { result } = renderHook(() => {
      const [count, setCount] = useState(0);
      const getCount = useMemoizedFn(() => count);
      return { setCount, getCount };
    });
    expect(result.current.getCount()).toBe(0);

    act(() => result.current.setCount(123));

    expect(result.current.getCount()).toBe(123);
  });

  test('should forward `this` correctly', async () => {
    const { result } = renderHook(() => {
      const getMulti = useMemoizedFn(function (this: { multiplier: number }) {
        return this.multiplier;
      });
      return { getMulti };
    });

    const obj = { multiplier: 2, fn: result.current.getMulti };

    expect(obj.fn()).toBe(2);
  });

  test('should keep stable reference on parent rerender (without state updates)', async () => {
    const { result, rerender } = renderHook(() => {
      const fn = useMemoizedFn(() => 'ok');
      return { fn };
    });

    const firstFn = result.current.fn;

    rerender();
    expect(result.current.fn).toBe(firstFn);

    rerender();
    expect(result.current.fn).toBe(firstFn);
  });

  test('should keep stable wrapper even if input fn identity changes every render, and always call latest logic', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => {
        const fn = useMemoizedFn(() => value);
        return { fn };
      },
      { initialProps: { value: 'first' } },
    );

    const stableFn = result.current.fn;

    expect(stableFn()).toBe('first');

    rerender({ value: 'second' });
    expect(result.current.fn()).toBe('second'); // 內容指向最新
    expect(result.current.fn).toBe(stableFn); // 沒變
  });

  test('should work correctly under StrictMode', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StrictMode>
        <div>{children}</div>
      </StrictMode>
    );

    const { result } = renderHook(
      () => {
        const [count, setCount] = useState(0);
        const fn = useMemoizedFn(() => count);
        return { fn, setCount };
      },
      { wrapper },
    );

    const first = result.current.fn;

    act(() => {
      result.current.setCount(1);
    });

    expect(result.current.fn).toBe(first);
    expect(result.current.fn()).toBe(1);
  });
});
