import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { useAsyncEffect } from '..';

describe('useAsyncEffect', () => {
  test('should run async effect on Mount', async () => {
    const fn = vi.fn();
    renderHook(() => useAsyncEffect(fn));
    // effect 是 非同步執行 的，所以需要使用 waitFor 來等待它執行完成。
    await waitFor(() => {
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
  test('should rerun effect when deps change', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(({ id }) => useAsyncEffect(fn, [id]), {
      initialProps: { id: 1 },
    });

    await waitFor(() => {
      expect(fn).toHaveBeenCalledTimes(1);
    });

    rerender({ id: 2 });
    await waitFor(() => {
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
  test('should not cancel when still mounted', async () => {
    let cancelledValue = true;

    const effect = vi.fn(async (isCancelled: () => boolean) => {
      await Promise.resolve();
      cancelledValue = isCancelled();
    });

    renderHook(() => useAsyncEffect(effect, []));

    await waitFor(() => {
      expect(effect).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await Promise.resolve(); // 微任務先完成，再檢查 cancelledValue
    });

    expect(cancelledValue).toBe(false);
  });
  test('should set cancelled to true on unmount', async () => {
    vi.useFakeTimers();

    let cancelledValue = false;

    const effect = vi.fn(async (isCancelled: () => boolean) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      cancelledValue = isCancelled();
    });

    const { unmount } = renderHook(() => useAsyncEffect(effect, []));

    expect(effect).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(50);
      await Promise.resolve();
    });

    expect(cancelledValue).toBe(true);

    vi.useRealTimers();
  });
  test('should call console.error when effect throws and not cancelled', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('effect error');
    const effect = vi.fn().mockRejectedValue(error);

    renderHook(() => useAsyncEffect(effect, []));

    await waitFor(() => {
      expect(effect).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);

    consoleErrorSpy.mockRestore();
  });
  test('should not call console.error when effect throws after unmount', async () => {
    vi.useFakeTimers();

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('effect error');
    const effect = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      throw error;
    });

    const { unmount } = renderHook(() => useAsyncEffect(effect, []));

    expect(effect).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(50);
      await Promise.resolve();
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
  });
});
