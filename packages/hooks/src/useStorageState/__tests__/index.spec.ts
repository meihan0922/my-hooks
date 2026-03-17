import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createStorageStateHook, useCookieState, useLocalStorageState, useSessionStorageState } from '..';

describe('useLocalStorageState', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  test('should initialize with defaultValue when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorageState<number>('count', { defaultValue: 0 }));

    expect(result.current[0]).toBe(0);
    expect(window.localStorage.getItem('count')).toBeNull();
  });

  test('should initialize with value from localStorage if present', () => {
    window.localStorage.setItem('count', JSON.stringify(123));

    const { result } = renderHook(() => useLocalStorageState<number>('count', { defaultValue: 0 }));

    expect(result.current[0]).toBe(123);
  });

  test('should update state and localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorageState<number>('count', { defaultValue: 0 }));

    act(() => {
      result.current[1](456);
    });

    expect(result.current[0]).toBe(456);
    expect(window.localStorage.getItem('count')).toBe(JSON.stringify(456));
  });

  test('should support updater function', () => {
    const { result } = renderHook(() => useLocalStorageState<number>('count', { defaultValue: 1 }));

    act(() => {
      result.current[1](prev => (prev ?? 0) + 1);
    });

    expect(result.current[0]).toBe(2);
    expect(window.localStorage.getItem('count')).toBe(JSON.stringify(2));
  });

  test('should remove item from localStorage when setValue(undefined) is called', () => {
    window.localStorage.setItem('count', JSON.stringify(123));

    const { result } = renderHook(() => useLocalStorageState<number | undefined>('count', { defaultValue: 0 }));

    act(() => {
      result.current[1](undefined);
    });

    expect(result.current[0]).toBeUndefined();
    expect(window.localStorage.getItem('count')).toBeNull();
  });

  test('should store falsy number value 0', () => {
    const { result } = renderHook(() => useLocalStorageState<number>('num', { defaultValue: 1 }));

    act(() => {
      result.current[1](0);
    });

    expect(result.current[0]).toBe(0);
    expect(window.localStorage.getItem('num')).toBe(JSON.stringify(0));
  });

  test('should store falsy boolean value false', () => {
    const { result } = renderHook(() => useLocalStorageState<boolean>('bool', { defaultValue: true }));

    act(() => {
      result.current[1](false);
    });

    expect(result.current[0]).toBe(false);
    expect(window.localStorage.getItem('bool')).toBe(JSON.stringify(false));
  });

  test('should store falsy string value empty string', () => {
    const { result } = renderHook(() => useLocalStorageState<string>('text', { defaultValue: 'hello' }));

    act(() => {
      result.current[1]('');
    });

    expect(result.current[0]).toBe('');
    expect(window.localStorage.getItem('text')).toBe(JSON.stringify(''));
  });

  test('should fall back to defaultValue when localStorage contains invalid JSON', () => {
    window.localStorage.setItem('count', '{bad json');

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorageState<number>('count', { defaultValue: 99 }));

    expect(result.current[0]).toBe(99);
    expect(errorSpy).toHaveBeenCalled();
  });

  test('should support lazy defaultValue', () => {
    const factory = vi.fn(() => 42);

    const { result } = renderHook(() => useLocalStorageState<number>('count', { defaultValue: factory }));

    expect(result.current[0]).toBe(42);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  test('should support updater function when initial value is undefined', () => {
    const { result } = renderHook(() => useLocalStorageState<number | undefined>('count'));

    act(() => {
      result.current[1](prev => (prev ?? 0) + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(window.localStorage.getItem('count')).toBe(JSON.stringify(1));
  });

  test('should not call lazy defaultValue when localStorage already has value', () => {
    window.localStorage.setItem('count', JSON.stringify(7));
    const factory = vi.fn(() => 42);

    const { result } = renderHook(() => useLocalStorageState<number>('count', { defaultValue: factory }));

    expect(result.current[0]).toBe(7);
  });

  test('should still update state when storage.setItem throws', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useLocalStorageState<number>('count', { defaultValue: 0 }));

    act(() => {
      result.current[1](123);
    });

    expect(result.current[0]).toBe(123);
    expect(errorSpy).toHaveBeenCalledWith('Error setting storage item count:', expect.any(Error));
  });

  test('should still update state when storage.removeItem throws', () => {
    window.localStorage.setItem('count', JSON.stringify(123));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useLocalStorageState<number | undefined>('count', { defaultValue: 0 }));

    act(() => {
      result.current[1](undefined);
    });

    expect(result.current[0]).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith('Error setting storage item count:', expect.any(Error));
  });
});

describe('useStorageState with undefined storage (SSR)', () => {
  const useStorageStateNoStorage = createStorageStateHook(() => undefined);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('should use defaultValue when storage is undefined', () => {
    const { result } = renderHook(() => useStorageStateNoStorage<number>('count', { defaultValue: 42 }));

    expect(result.current[0]).toBe(42);
  });

  test('should update state when storage is undefined (no-op for persistence)', () => {
    const { result } = renderHook(() => useStorageStateNoStorage<number>('count', { defaultValue: 0 }));

    act(() => {
      result.current[1](100);
    });

    expect(result.current[0]).toBe(100);
  });

  test('should support setValue(undefined) when storage is undefined', () => {
    const { result } = renderHook(() => useStorageStateNoStorage<number | undefined>('count', { defaultValue: 0 }));

    act(() => {
      result.current[1](undefined);
    });

    expect(result.current[0]).toBeUndefined();
  });
});

describe('useSessionStorageState', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  test('should initialize with defaultValue when sessionStorage is empty', () => {
    const { result } = renderHook(() => useSessionStorageState<number>('count', { defaultValue: 0 }));

    expect(result.current[0]).toBe(0);
    expect(window.sessionStorage.getItem('count')).toBeNull();
  });

  test('should initialize with value from sessionStorage if present', () => {
    window.sessionStorage.setItem('count', JSON.stringify(123));

    const { result } = renderHook(() => useSessionStorageState<number>('count', { defaultValue: 0 }));

    expect(result.current[0]).toBe(123);
  });

  test('should update state and sessionStorage when setValue is called', () => {
    const { result } = renderHook(() => useSessionStorageState<number>('count', { defaultValue: 0 }));

    act(() => {
      result.current[1](456);
    });

    expect(result.current[0]).toBe(456);
    expect(window.sessionStorage.getItem('count')).toBe(JSON.stringify(456));
    expect(window.localStorage.getItem('count')).toBeNull();
  });

  test('should remove item from sessionStorage when setValue(undefined) is called', () => {
    window.sessionStorage.setItem('count', JSON.stringify(123));

    const { result } = renderHook(() => useSessionStorageState<number | undefined>('count', { defaultValue: 0 }));

    act(() => {
      result.current[1](undefined);
    });

    expect(result.current[0]).toBeUndefined();
    expect(window.sessionStorage.getItem('count')).toBeNull();
  });

  test('should support updater function', () => {
    const { result } = renderHook(() => useSessionStorageState<number>('count', { defaultValue: 1 }));

    act(() => {
      result.current[1](prev => (prev ?? 0) + 1);
    });

    expect(result.current[0]).toBe(2);
    expect(window.sessionStorage.getItem('count')).toBe(JSON.stringify(2));
  });
});

describe('useCookieState', () => {
  beforeEach(() => {
    // 清空測試會用到的 cookie
    document.cookie = 'count=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'flag=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'text=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'bad=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    vi.restoreAllMocks();
  });

  test('should initialize with defaultValue when cookie is empty', () => {
    const { result } = renderHook(() => useCookieState<number>('count', { defaultValue: 0 }));

    expect(result.current[0]).toBe(0);
  });

  test('should initialize with value from cookie if present', () => {
    document.cookie = `count=${encodeURIComponent(JSON.stringify(123))}; path=/`;

    const { result } = renderHook(() => useCookieState<number>('count', { defaultValue: 0 }));

    expect(result.current[0]).toBe(123);
  });

  test('should update state and cookie when setValue is called', () => {
    const { result } = renderHook(() => useCookieState<number>('count', { defaultValue: 0 }));

    act(() => {
      result.current[1](456);
    });

    expect(result.current[0]).toBe(456);
    expect(document.cookie).toContain(`count=${encodeURIComponent(JSON.stringify(456))}`);
  });

  test('should support updater function', () => {
    const { result } = renderHook(() => useCookieState<number>('count', { defaultValue: 1 }));

    act(() => {
      result.current[1](prev => (prev ?? 0) + 1);
    });

    expect(result.current[0]).toBe(2);
    expect(document.cookie).toContain(`count=${encodeURIComponent(JSON.stringify(2))}`);
  });

  test('should remove cookie when setValue(undefined) is called', () => {
    document.cookie = `count=${encodeURIComponent(JSON.stringify(123))}; path=/`;

    const { result } = renderHook(() => useCookieState<number | undefined>('count', { defaultValue: 0 }));

    act(() => {
      result.current[1](undefined);
    });

    expect(result.current[0]).toBeUndefined();
    expect(document.cookie).not.toContain('count=');
  });

  test('should store falsy number value 0', () => {
    const { result } = renderHook(() => useCookieState<number>('count', { defaultValue: 1 }));

    act(() => {
      result.current[1](0);
    });

    expect(result.current[0]).toBe(0);
    expect(document.cookie).toContain(`count=${encodeURIComponent(JSON.stringify(0))}`);
  });

  test('should store falsy boolean value false', () => {
    const { result } = renderHook(() => useCookieState<boolean>('flag', { defaultValue: true }));

    act(() => {
      result.current[1](false);
    });

    expect(result.current[0]).toBe(false);
    expect(document.cookie).toContain(`flag=${encodeURIComponent(JSON.stringify(false))}`);
  });

  test('should store falsy string value empty string', () => {
    const { result } = renderHook(() => useCookieState<string>('text', { defaultValue: 'hello' }));

    act(() => {
      result.current[1]('');
    });

    expect(result.current[0]).toBe('');
    expect(document.cookie).toContain(`text=${encodeURIComponent(JSON.stringify(''))}`);
  });

  test('should fall back to defaultValue when cookie contains invalid JSON', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    document.cookie = 'bad=not-json; path=/';

    const { result } = renderHook(() => useCookieState<number>('bad', { defaultValue: 99 }));

    expect(result.current[0]).toBe(99);
    expect(errorSpy).toHaveBeenCalled();
  });

  test('should support lazy defaultValue', () => {
    const factory = vi.fn(() => 42);

    const { result } = renderHook(() => useCookieState<number>('count', { defaultValue: factory }));

    expect(result.current[0]).toBe(42);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  test('should initialize with defaultValue when cookie has other keys but not target key', () => {
    document.cookie = 'other=value; path=/';

    const { result } = renderHook(() => useCookieState<number>('count', { defaultValue: 99 }));

    expect(result.current[0]).toBe(99);
  });
});
