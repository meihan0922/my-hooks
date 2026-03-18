import { act, renderHook } from '@testing-library/react';
import React, { useRef } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useClickAway } from '..';

describe('useClickAway', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  test('should not trigger when clicking inside the target', () => {
    const onClickAway = vi.fn();
    const container = document.createElement('div');
    const inside = document.createElement('div');
    container.appendChild(inside);
    document.body.appendChild(container);

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      useClickAway(ref, onClickAway);
    });

    act(() => {
      inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(onClickAway).not.toHaveBeenCalled();
  });

  test('should trigger when clicking outside target', () => {
    const onClickAway = vi.fn();

    const container = document.createElement('div');
    const outside = document.createElement('button');
    document.body.appendChild(container);
    document.body.appendChild(outside);

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      useClickAway(ref, onClickAway);
    });

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onClickAway).toHaveBeenCalledTimes(1);
    // 第一次呼叫的第一個參數應該是 MouseEvent
    expect(onClickAway.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  test('should not trigger when clicking inside any target in target array', () => {
    const onClickAway = vi.fn();
    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    const inside1 = document.createElement('div');
    const inside2 = document.createElement('div');
    container1.appendChild(inside1);
    container2.appendChild(inside2);
    document.body.appendChild(container1);
    document.body.appendChild(container2);

    renderHook(() => {
      const ref1 = useRef<HTMLDivElement | null>(container1);
      const ref2 = useRef<HTMLDivElement | null>(container2);
      useClickAway([ref1, ref2], onClickAway);
    });

    inside1.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    inside2.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onClickAway).not.toHaveBeenCalled();
  });

  test('should not trigger when clicking inside any target in target array', () => {
    const onClickAway = vi.fn();

    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    const inside1 = document.createElement('button');
    const inside2 = document.createElement('button');

    container1.appendChild(inside1);
    container2.appendChild(inside2);

    document.body.appendChild(container1);
    document.body.appendChild(container2);

    renderHook(() => {
      const ref1 = useRef<HTMLDivElement | null>(container1);
      const ref2 = useRef<HTMLDivElement | null>(container2);
      useClickAway([ref1, ref2], onClickAway);
    });

    inside1.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    inside2.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onClickAway).not.toHaveBeenCalled();
  });

  test('should trigger when clicking outside all targets in target array', () => {
    const onClickAway = vi.fn();

    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    const outside = document.createElement('button');

    document.body.appendChild(container1);
    document.body.appendChild(container2);
    document.body.appendChild(outside);

    renderHook(() => {
      const ref1 = useRef<HTMLDivElement | null>(container1);
      const ref2 = useRef<HTMLDivElement | null>(container2);
      useClickAway([ref1, ref2], onClickAway);
    });

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onClickAway).toHaveBeenCalledTimes(1);
  });

  test('should not trigger after unmount', () => {
    const onClickAway = vi.fn();

    const container = document.createElement('div');
    const outside = document.createElement('button');
    document.body.appendChild(container);
    document.body.appendChild(outside);

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      useClickAway(ref, onClickAway);
    });

    unmount();

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onClickAway).not.toHaveBeenCalled();
  });

  test('should support custom event names', () => {
    const onClickAway = vi.fn();

    const container = document.createElement('div');
    const outside = document.createElement('button');
    document.body.appendChild(container);
    document.body.appendChild(outside);

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      useClickAway(ref, onClickAway, ['click']);
    });

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onClickAway).not.toHaveBeenCalled();

    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClickAway).toHaveBeenCalledTimes(1);
  });

  test('should support passing element directly', () => {
    const onClickAway = vi.fn();

    const container = document.createElement('div');
    const outside = document.createElement('button');
    document.body.appendChild(container);
    document.body.appendChild(outside);

    renderHook(() => {
      useClickAway(container, onClickAway);
    });

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onClickAway).toHaveBeenCalledTimes(1);
  });

  test('should not throw when target is null', () => {
    const onClickAway = vi.fn();

    expect(() => {
      renderHook(() => {
        const ref = { current: null };
        useClickAway(ref, onClickAway);
      });
    }).not.toThrow();
  });

  test('should not trigger when target is null (empty targetElements)', () => {
    const onClickAway = vi.fn();
    const outside = document.createElement('button');
    document.body.appendChild(outside);

    renderHook(() => useClickAway(null, onClickAway));

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onClickAway).not.toHaveBeenCalled();
  });

  test('should not trigger when target is undefined (empty targetElements)', () => {
    const onClickAway = vi.fn();
    const outside = document.createElement('button');
    document.body.appendChild(outside);

    renderHook(() => useClickAway(undefined as unknown as HTMLElement, onClickAway));

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onClickAway).not.toHaveBeenCalled();
  });

  test('should not trigger when event.target is null', () => {
    const onClickAway = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);

    renderHook(() => useClickAway(container, onClickAway));

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: null, configurable: true });
    document.dispatchEvent(event);

    expect(onClickAway).not.toHaveBeenCalled();
  });

  test('should not add listener when document is undefined (SSR)', () => {
    const onClickAway = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const useEffectSpy = vi.spyOn(React, 'useEffect');
    useEffectSpy.mockImplementation((effect: () => void | (() => void)) => {
      const originalDoc = globalThis.document;
      vi.stubGlobal('document', undefined); // stubGlobal: 用來模擬全域變數
      const cleanup = effect();
      vi.stubGlobal('document', originalDoc);
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    });

    renderHook(() => useClickAway(container, onClickAway));

    expect(onClickAway).not.toHaveBeenCalled();
    useEffectSpy.mockRestore();
    vi.unstubAllGlobals(); // unstubAllGlobals: 移除所有 stub 的全域變數
  });
});
