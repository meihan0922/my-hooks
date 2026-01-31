import { renderHook } from '@testing-library/react';
import { act, useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { useUnmount } from '..';

describe('useUnmount', () => {
  test('should NOT call fn on mount, only call once on unmount', async () => {
    const fn = vi.fn(); // 返回一個可呼叫的模擬函式
    const { unmount } = renderHook(() => {
      useUnmount(fn);
    });

    // mount 不應該呼叫
    expect(fn).not.toHaveBeenCalled();
    unmount();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should call the latest fn implementation on unmount (no stale closure)', () => {
    // 最終執行 unmount 時，fn 會將當前 state 推入，測試是否是最新的 state
    const calls: number[] = [];

    const { result, unmount } = renderHook(() => {
      const [count, setCount] = useState(0);

      useUnmount(() => {
        calls.push(count); // should push the latest count
      });

      return { setCount };
    });

    act(() => result.current.setCount(1));
    act(() => result.current.setCount(2));

    unmount();

    expect(calls).toEqual([2]);
  });
});
