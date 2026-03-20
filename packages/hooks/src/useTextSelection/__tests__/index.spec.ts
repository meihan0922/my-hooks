import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { useTextSelection } from '..';

describe('useTextSelection', () => {
  test('should register and clean up selectionchange event listener', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useTextSelection());

    expect(addSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function));
  });

  test('should return null when no selection', () => {
    vi.spyOn(document, 'getSelection').mockReturnValue({
      rangeCount: 0,
      toString: () => '',
    } as unknown as Selection);
    const { result } = renderHook(() => useTextSelection());

    act(() => {
      document.dispatchEvent(new Event('selectionchange'));
    });

    expect(result.current).toBe(null);
  });

  test('should return selected text and rect when selection exists', () => {
    const rect = {
      x: 10,
      y: 20,
      width: 100,
      height: 30,
      top: 20,
      right: 110,
      bottom: 50,
      left: 10,
      toJSON: () => ({}),
    } as DOMRect;

    const mockRange = {
      getBoundingClientRect: vi.fn(() => rect),
    } as unknown as Range;

    vi.spyOn(document, 'getSelection').mockReturnValue({
      rangeCount: 1,
      toString: () => 'hello world',
      getRangeAt: vi.fn(() => mockRange),
    } as unknown as Selection);

    const { result } = renderHook(() => useTextSelection());

    act(() => {
      document.dispatchEvent(new Event('selectionchange'));
    });

    expect(result.current).toEqual({
      text: 'hello world',
      rect,
    });
  });

  test('should return null when selection text is empty', () => {
    const mockRange = {
      getBoundingClientRect: vi.fn(),
    } as unknown as Range;

    vi.spyOn(window, 'getSelection').mockReturnValue({
      rangeCount: 1,
      toString: () => '',
      getRangeAt: vi.fn(() => mockRange),
    } as unknown as Selection);

    const { result } = renderHook(() => useTextSelection());

    act(() => {
      document.dispatchEvent(new Event('selectionchange'));
    });

    expect(result.current).toBeNull();
  });
  test('should return null when getSelection returns null', () => {
    vi.spyOn(window, 'getSelection').mockReturnValue(null);

    const { result } = renderHook(() => useTextSelection());

    act(() => {
      document.dispatchEvent(new Event('selectionchange'));
    });

    expect(result.current).toBeNull();
  });
});
