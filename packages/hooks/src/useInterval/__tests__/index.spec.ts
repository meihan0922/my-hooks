import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useInterval } from '..';

describe('useInterval', () => {
  beforeEach(() => {
    // 模擬系統時間
    vi.useFakeTimers();
  });

  afterEach(() => {
    // 恢復系統時間
    vi.useRealTimers();
  });

  test('should call fn repeatedly with given delay', () => {
    const fn = vi.fn();

    renderHook(() => useInterval(fn, 1000));

    act(() => {
      vi.advanceTimersByTime(3000); // 指定計時器過了三秒
    });

    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('should call the latest fn without resetting interval', () => {
    // 中間換了 props 的回調，正確執行最新的 fn
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    const { rerender } = renderHook(({ fn }: { fn: () => void }) => useInterval(fn, 1000), {
      initialProps: { fn: fn1 },
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(0);

    rerender({ fn: fn2 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  test('should pause interval when delay is null', () => {
    const fn = vi.fn();

    const { rerender } = renderHook(({ delay }: { delay: number | null }) => useInterval(fn, delay), {
      initialProps: { delay: 1000 },
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(fn).toHaveBeenCalledTimes(2);

    // @ts-expect-error: testing
    rerender({ delay: null }); // 計時器應被暫停

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('should restart interval when delay changes', () => {
    const fn = vi.fn();

    const { rerender } = renderHook(({ delay }: { delay: number }) => useInterval(fn, delay), {
      initialProps: { delay: 1000 },
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn).toHaveBeenCalledTimes(1);

    rerender({ delay: 500 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('should clear interval on unmount', () => {
    const fn = vi.fn();

    const { unmount } = renderHook(() => useInterval(fn, 1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
