import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { useEventEmitter } from '..';

describe('useEventEmitter', () => {
  test('should emit value to all subscriber', () => {
    const listener = vi.fn();
    const { result } = renderHook(() => {
      const emitter = useEventEmitter<string>();
      emitter.useSubscription(listener);
      return emitter;
    });

    act(() => {
      result.current.emit('test');
    });

    expect(listener).toHaveBeenCalledWith('test');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('should notify all subscribers when emit', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const { result } = renderHook(() => {
      const emitter = useEventEmitter<string>();
      emitter.useSubscription(listener1);
      emitter.useSubscription(listener2);
      return emitter;
    });

    act(() => {
      result.current.emit('test');
    });
    expect(listener1).toHaveBeenCalledWith('test');
    expect(listener2).toHaveBeenCalledWith('test');
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  test('should unsubscribe automatically when component unmounts', () => {
    const listener = vi.fn();
    const { result, unmount } = renderHook(() => {
      const emitter = useEventEmitter<string>();
      emitter.useSubscription(listener);
      return emitter;
    });

    unmount();

    act(() => {
      result.current.emit('test');
    });

    expect(listener).not.toHaveBeenCalled();
  });

  test('should use latest callback after rerender', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const { result, rerender } = renderHook(
      ({ listener }: { listener: (value: string) => void }) => {
        const emitter = useEventEmitter<string>();
        emitter.useSubscription(listener);
        return emitter;
      },
      {
        initialProps: {
          listener: listener1,
        },
      },
    );

    act(() => {
      result.current.emit('test');
    });

    expect(listener1).toHaveBeenCalledWith('test');
    expect(listener1).toHaveBeenCalledTimes(1);

    rerender({ listener: listener2 });

    act(() => {
      result.current.emit('test');
    });

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledWith('test');
    expect(listener2).toHaveBeenCalledTimes(1);
  });
});
