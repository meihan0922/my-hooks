import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { useCreation } from '..';

describe('useCreation', () => {
  test('should create value on first render', () => {
    const factory = vi.fn(() => ({
      count: 1,
    }));
    const { result } = renderHook(() => useCreation(factory, []));
    expect(factory).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({ count: 1 });
  });
  test('should not recreate when deps do not change', () => {
    const factory = vi.fn(() => ({
      count: 1,
    }));
    const { result, rerender } = renderHook(({ dep }: { dep: number }) => useCreation(factory, [dep]), {
      initialProps: { dep: 1 },
    });
    const firstValue = result.current;

    rerender({ dep: 1 });
    expect(result.current).toBe(firstValue);
  });
  test('should recreate when deps change', () => {
    const factory = vi.fn(() => ({
      count: 1,
    }));
    const { result, rerender } = renderHook(({ dep }: { dep: number }) => useCreation(factory, [dep]), {
      initialProps: { dep: 1 },
    });
    const firstValue = result.current;

    rerender({ dep: 2 });
    expect(factory).toHaveBeenCalledTimes(2);
    expect(result.current).not.toBe(firstValue);
  });
  test('should compare multiple deps correctly', () => {
    const factory = vi.fn(() => ({ value: 'test' }));

    const { rerender } = renderHook(({ a, b }: { a: number; b: string }) => useCreation(factory, [a, b]), {
      initialProps: { a: 1, b: 'x' },
    });

    expect(factory).toHaveBeenCalledTimes(1);

    rerender({ a: 1, b: 'x' });
    expect(factory).toHaveBeenCalledTimes(1);

    rerender({ a: 2, b: 'x' });
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
