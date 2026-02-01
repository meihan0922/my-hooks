import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { useEventListener } from '..';

/**
 * 目標：
 * 1. 有成功綁定且會觸發
 * 2. unmount 確實移除
 * 3. handler 更新後，不用重綁也能用最新 handler（避免 stale closure）
 * 4. target 用 ref：ref.current 從 null → element 後可以綁上
 */
describe('useEventListener', () => {
  test('should call handler when event is dispatched', async () => {
    const ta = new EventTarget();
    const handler = vi.fn();
    renderHook(() => useEventListener('test', handler, ta));

    ta.dispatchEvent(new Event('test'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('should remove listener on unmount', async () => {
    const ta = new EventTarget();
    const handler = vi.fn();
    const result = renderHook(() => useEventListener('test', handler, ta));

    ta.dispatchEvent(new Event('test'));
    expect(handler).toHaveBeenCalledTimes(1);

    result.unmount();

    ta.dispatchEvent(new Event('test'));
    expect(handler).toHaveBeenCalledTimes(1); // 不會再被呼叫，因此維持 1
  });

  test('should always call the latest handler without re-binding', () => {
    // 先執行 handler1 後面更新為 handler2，再測試 handler1、handler2 應該維持被呼叫 1 次
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const ta = new EventTarget();
    const result = renderHook(({ handlerFn }) => useEventListener('test', handlerFn, ta), {
      initialProps: {
        handlerFn: handler1,
      },
    });

    ta.dispatchEvent(new Event('test'));
    expect(handler1).toHaveBeenCalledTimes(1);

    result.rerender({
      handlerFn: handler2,
    });

    ta.dispatchEvent(new Event('test'));
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  test('should attach to ref target when ref.current becomes available', () => {
    // 先給訂一個空的 ref，dispatch 後，不應該觸發
    // 再給 ref 賦值，再 dispatch 後，測試觸發
    const target = new EventTarget();
    const handler = vi.fn();
    const result = renderHook(() => {
      const ref = useRef<EventTarget | null>(null);
      useEventListener('test', handler, ref);
      return { ref };
    });

    target.dispatchEvent(new Event('test'));
    expect(handler).toHaveBeenCalledTimes(0);

    act(() => (result.result.current.ref.current = target));
    // 需要 rerender 才會讓 hook 重新讀取 ta 並綁上
    result.rerender();

    target.dispatchEvent(new Event('test'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
  test('should remove listener correctly when capture option is used', () => {
    const target = new EventTarget();
    const handler = vi.fn();

    const { unmount } = renderHook(() => {
      useEventListener('test', handler, target, true); // capture = true
    });

    target.dispatchEvent(new Event('test'));
    expect(handler).toHaveBeenCalledTimes(1);

    unmount();

    target.dispatchEvent(new Event('test'));
    // 如果 remove 時忘了帶 capture=true，這裡會變成 2
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
