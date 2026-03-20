import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useFocusWithin } from '..';

describe('useFocusWithin', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  test('should trigger onFocus when focusing inside element', () => {
    const onFocus = vi.fn();

    const container = document.createElement('div');
    const input = document.createElement('input');
    container.appendChild(input);
    document.body.appendChild(container);

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      useFocusWithin(ref, { onFocus });
    });

    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
  });

  test('should not trigger onBlur when focus moves inside the same container', () => {
    const onBlur = vi.fn();

    const container = document.createElement('div');
    const input = document.createElement('input');
    const button = document.createElement('button');

    container.appendChild(input);
    container.appendChild(button);
    document.body.appendChild(container);

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      useFocusWithin(ref, { onBlur });
    });

    input.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: button, // focus 要移動到哪個元素，使用者把 focus 從 input 移到 button
      }),
    );

    expect(onBlur).not.toHaveBeenCalled();
  });

  test('should trigger onBlur when focus leaves the container', () => {
    const onBlur = vi.fn();

    const container = document.createElement('div');
    const input = document.createElement('input');
    const outside = document.createElement('button');

    container.appendChild(input);
    document.body.appendChild(container);
    document.body.appendChild(outside);

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      useFocusWithin(ref, { onBlur });
    });

    input.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: outside,
      }),
    );

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onBlur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
  });

  test('should trigger onBlur when relatedTarget is null', () => {
    const onBlur = vi.fn();

    const container = document.createElement('div');
    const input = document.createElement('input');

    container.appendChild(input);
    document.body.appendChild(container);

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      useFocusWithin(ref, { onBlur });
    });

    input.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: null,
      }),
    );

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('should not trigger after unmount', () => {
    const onFocus = vi.fn();

    const container = document.createElement('div');
    const input = document.createElement('input');
    container.appendChild(input);
    document.body.appendChild(container);

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      useFocusWithin(ref, { onFocus });
    });

    unmount();

    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(onFocus).not.toHaveBeenCalled();
  });

  test('ref is null', () => {
    const onFocus = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(null);
      useFocusWithin(ref, { onFocus });
    });

    expect(onFocus).not.toHaveBeenCalled();
  });

  test('should work without options (default empty object)', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    container.appendChild(input);
    document.body.appendChild(container);

    expect(() => {
      renderHook(() => {
        const ref = useRef<HTMLDivElement | null>(container);
        useFocusWithin(ref); // 不傳 options
      });
    }).not.toThrow();
  });
});
