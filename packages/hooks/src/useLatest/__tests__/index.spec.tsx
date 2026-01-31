import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { useLatest } from '..';

describe('useLatest', () => {
  test('should keep the same ref instance across renders', async () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), { initialProps: { value: 1 } });
    const firstRef = result.current;

    rerender({ value: 2 });
    // ref 一樣，是 ref.current 不同
    expect(result.current).toBe(firstRef);
  });

  test('should always point to the latest value', async () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), { initialProps: { value: 1 } });

    expect(result.current.current).toBe(1);
    rerender({ value: 2 });
    expect(result.current.current).toBe(2);
  });
});
