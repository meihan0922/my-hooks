import { renderHook } from '@testing-library/react';
import { act, useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { useMount } from '..';

describe('useMount', () => {
  test('should call fn once on mount', async () => {
    const fn = vi.fn(); // 返回一個可呼叫的模擬函式
    renderHook(() => {
      useMount(fn);
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });
  test('should NOT call fn again on rerender', async () => {
    const fn = vi.fn(); // 返回一個可呼叫的模擬函式

    const { result, rerender } = renderHook(() => {
      const [, setCount] = useState(0);
      useMount(fn);
      return { setCount };
    });

    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setCount(1);
    });
    rerender();

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
