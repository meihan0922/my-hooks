import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useThrottleFn } from '..';

/**
 * 目標：
 * 1. leading: true, trailing: true，第一次立刻執行，計時器內觸發則結束後再次呼叫
 * 2. leading: true, trailing: false，第一次立刻執行，計時器內觸發則結束後不再呼叫
 * 3. leading: false, trailing: true，計時器內觸發則結束後再次呼叫
 * 4. leading: false, trailing: false，完全不執行
 * 5. cancel 取消當前 throttle
 * 6. flush 立即執行當前 pending 的 throttle，且原 throttle 會被取消
 * 7. fn 更新後，會調用最新 fn
 * 8. 卸載時會取消當前 timer
 */
describe('useThrottleFn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('leading: true, trailing: true, should call fn immediately and then throttle subsequent calls', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 1000 }));

    act(() => {
      result.current.run(1);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);

    act(() => {
      result.current.run(2);
      result.current.run(3);
    });
    // 不應該再次呼叫
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(3);
  });
  test('leading: true, trailing: false, should call fn immediately and then not call again until the timer ends', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 1000, trailing: false }));

    act(() => {
      result.current.run(1);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(1);

    act(() => {
      result.current.run(2);
      result.current.run(3);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn).toHaveBeenLastCalledWith(1);
  });
  test('leading: false, trailing: true, should not call fn immediately and then call again after the timer ends', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 1000, leading: false }));

    act(() => {
      result.current.run(1);
    });
    expect(fn).toHaveBeenCalledTimes(0);

    act(() => {
      result.current.run(2);
      result.current.run(3);
    });
    expect(fn).toHaveBeenCalledTimes(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(3);
  });
  test('leading: false, trailing: false, should never invoke fn', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 1000, leading: false, trailing: false }));

    act(() => {
      result.current.run(1);
      result.current.run(2);
      result.current.run(3);
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(fn).toHaveBeenCalledTimes(0);
  });
  test('cancel should cancel pending trailing call', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 1000 }));

    act(() => {
      result.current.run(1);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.run(2);
      result.current.cancel();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(1);
  });
  test('flush should immediately invoke pending trailing call', () => {
    const fn = vi.fn(x => x * 2);
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 1000 }));

    act(() => {
      result.current.run(1);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(1);

    act(() => {
      result.current.run(2);
      result.current.run(3);
    });

    let output: number | undefined;
    act(() => {
      output = result.current.flush();
    });
    expect(output).toBe(6);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });
  test('should use the latest fn if fn changes before execution', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ fn }: { fn: (...args: any[]) => any }) => useThrottleFn(fn, { wait: 1000, leading: false, trailing: true }),
      { initialProps: { fn: fn1 } },
    );

    act(() => {
      result.current.run('X');
    });

    rerender({ fn: fn2 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn1).toHaveBeenCalledTimes(0);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledWith('X');
  });
  test('should clear timer on unmount', () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useThrottleFn(fn, { wait: 1000, leading: false, trailing: true }));

    act(() => {
      result.current.run('A');
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(fn).toHaveBeenCalledTimes(0);
  });

  test('should use default options when no options passed', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottleFn(fn));

    act(() => {
      result.current.run(1);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);

    act(() => {
      result.current.run(2);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(2);
  });

  test('cancel when no active timer should still clear lastArgsRef', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 1000 }));

    act(() => {
      result.current.run(1);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.cancel();
    });
    act(() => {
      result.current.run(2);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('flush when lastArgsRef is null should return early', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 1000, leading: true, trailing: true }));

    act(() => {
      result.current.run(1);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.flush();
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('flush when timerIdRef is null should return early', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 1000 }));

    act(() => {
      result.current.run(1);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.flush();
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('flush when trailing is false should return early', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 1000, leading: true, trailing: false }));

    act(() => {
      result.current.run(1);
    });
    act(() => {
      result.current.run(2);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.flush();
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('timer callback when lastArgsRef is null should not invoke', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 1000, leading: true, trailing: true }));

    act(() => {
      result.current.run(1);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
