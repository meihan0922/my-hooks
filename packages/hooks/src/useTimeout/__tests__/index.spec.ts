import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTimeout } from '..';

describe('useTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call fn once after delay', () => {
    const fn = vi.fn();
    renderHook(() => useTimeout(fn, 1000));

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(fn).toHaveBeenCalledTimes(0);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should clear previous timeout when delay changes', () => {
    const fn = vi.fn();

    const { rerender } = renderHook(({ delay }: { delay: number }) => useTimeout(fn, delay), {
      initialProps: { delay: 1000 },
    });

    rerender({ delay: 2000 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pause when delay is null', () => {
    const fn = vi.fn();

    const { rerender } = renderHook(({ delay }: { delay: number | null }) => useTimeout(fn, delay), {
      initialProps: { delay: 1000 },
    });

    // @ts-expect-error: testing
    rerender({ delay: null });

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(fn).toHaveBeenCalledTimes(0);
  });

  it('should call latest fn if fn changes before timeout fires', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    const { rerender } = renderHook(({ fn }: { fn: () => void }) => useTimeout(fn, 1000), {
      initialProps: { fn: fn1 },
    });

    rerender({ fn: fn2 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(fn1).toHaveBeenCalledTimes(0);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('should clear on unmount', () => {
    const fn = vi.fn();

    const { unmount } = renderHook(() => useTimeout(fn, 1000));

    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(fn).toHaveBeenCalledTimes(0);
  });
});
