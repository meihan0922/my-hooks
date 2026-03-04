import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useDebounceFn } from '..';

/**
 * 目標：
 * 1. debounce 只會執行最後一次
 * 2. 連續執行 run 只會重新計時，不會立即執行
 * 3. cancel 取消當前 debounce
 * 4. flush 立即執行當前 debounce，且原 debounce 會被取消
 * 5. 卸載時會取消當前 debounce
 * 6. fn 更新後，會調用最新 fn
 */
describe('useDebounceFn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should debounce calls and run only once with the last arguments', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounceFn(fn, { wait: 1000 }));

    act(() => {
      result.current.run(1);
      result.current.run(2);
      result.current.run(3);
    });

    // 還沒到時間不執行
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(fn).toHaveBeenCalledTimes(0);

    // 到時間只執行一次，且用最後一次參數
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  test('should reset timer when run is called multiple times', async () => {
    const fn = vi.fn();
    const { run } = renderHook(() => useDebounceFn(fn, { wait: 1000 })).result.current;

    act(() => {
      run('a');
    });

    act(() => {
      vi.advanceTimersByTime(800);
    });

    act(() => {
      run('b');
    });

    // 等待 1000ms 後，fn 應該沒有被呼叫，計時器應該被重置
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(fn).toHaveBeenCalledTimes(0);

    // 距離 run('b') 被呼叫， 1000ms 後才執行
    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  test('cancel should cancel pending execution', () => {
    const fn = vi.fn();
    const { run, cancel } = renderHook(() => useDebounceFn(fn, { wait: 1000 })).result.current;

    act(() => {
      run('a');
      cancel();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn).toHaveBeenCalledTimes(0);
  });

  test('flush should run pending execution immediately and not run again later', () => {
    const fn = vi.fn();
    const { run, flush } = renderHook(() => useDebounceFn(fn, { wait: 1000 })).result.current;

    act(() => {
      run('a');
      run('b');
    });

    act(() => {
      flush();
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(fn).toHaveBeenCalledTimes(1); // 不會再被呼叫，因此維持 1
  });

  test('flush should return fn result when pending, otherwise undefined', () => {
    const fn = vi.fn(x => x * 2);
    const { run, flush } = renderHook(() => useDebounceFn(fn, { wait: 1000 })).result.current;

    // 直接執行 flush 應該返回 undefined
    expect(flush()).toBeUndefined();

    act(() => {
      run(2);
    });

    expect(flush()).toBe(4);
  });

  test('should call the latest fn implementation if fn changes before execution', () => {
    const fn1 = vi.fn(x => x * 2);
    const fn2 = vi.fn(x => x * 3);
    const { result, rerender } = renderHook(({ fn }) => useDebounceFn(fn, { wait: 1000 }), {
      initialProps: { fn: fn1 },
    });

    act(() => {
      result.current.run(2);
    });

    rerender({ fn: fn2 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn1).toHaveBeenCalledTimes(0);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledWith(2);
  });

  test('should cancel on unmount', () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useDebounceFn(fn));

    act(() => {
      result.current.run(1);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(fn).toHaveBeenCalledTimes(0);
  });

  test('default wait should be 1000ms', () => {
    const fn = vi.fn();
    const fn2 = vi.fn();
    const { result } = renderHook(() => useDebounceFn(fn));
    const { result: result2 } = renderHook(() => useDebounceFn(fn2, { wait: 2000 }));

    act(() => {
      result.current.run();
      result2.current.run();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(0);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  test('should use default wait when options is empty object', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounceFn(fn, {}));

    act(() => {
      result.current.run();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
